import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateDataModelDto, UpdateDataModelDto, PaginationQueryDto, PaginatedResult, DataModelResponse, DataModelVersionResponse } from '@edimp/contracts';
import { DataModelDiscoveryService } from './data-model-discovery.service';

@Injectable()
export class DataModelsService {
  constructor(
    private prisma: PrismaService,
    private discoveryService: DataModelDiscoveryService,
  ) {}

  private async verifyConnectionAccess(connectionId: string, userId: string) {
    const connection = await this.prisma.connection.findFirst({
      where: { id: connectionId, deletedAt: null },
      include: {
        connectorType: true,
        environment: {
          include: {
            workspace: {
              include: {
                tenant: {
                  include: {
                    members: { where: { userId } },
                  },
                },
                members: { where: { userId } },
              },
            },
          },
        },
      },
    });

    if (!connection || connection.environment.deletedAt || connection.environment.workspace.deletedAt || connection.environment.workspace.tenant.deletedAt) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    const hasTenantAccess = connection.environment.workspace.tenant.members.length > 0;
    const hasWorkspaceAccess = connection.environment.workspace.members.length > 0;

    if (!hasTenantAccess && !hasWorkspaceAccess) {
      throw new ForbiddenException(`User does not have access to Connection ${connectionId}`);
    }

    return connection;
  }

  async create(connectionId: string, dto: CreateDataModelDto, user: RequestUser): Promise<DataModelResponse> {
    const connection = await this.verifyConnectionAccess(connectionId, user.id);

    const existing = await this.prisma.dataModel.findFirst({
      where: {
        connectionId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`DataModel with name '${dto.name}' already exists in this connection`);
    }

    let entitiesToCreate = dto.entities;
    if (!entitiesToCreate || entitiesToCreate.length === 0) {
      const discovered = await this.discoveryService.discoverSchemaForConnection(
        connection.connectorType.name,
        {}
      );
      entitiesToCreate = discovered.map(e => ({
        name: e.name,
        description: e.description,
        fields: e.fields.map(f => ({
          name: f.name,
          dataType: f.dataType as any,
          isNullable: f.isNullable,
          isPrimaryKey: f.isPrimaryKey,
        })),
      }));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const dataModel = await tx.dataModel.create({
        data: {
          connectionId,
          name: dto.name,
          description: dto.description,
        },
      });

      const version = await tx.dataModelVersion.create({
        data: {
          dataModelId: dataModel.id,
          version: 1,
          status: 'DRAFT',
        },
      });

      for (const entity of entitiesToCreate || []) {
        const createdEntity = await tx.dataEntity.create({
          data: {
            dataModelVersionId: version.id,
            name: entity.name,
            description: entity.description,
          },
        });

        if (entity.fields && entity.fields.length > 0) {
          await tx.dataField.createMany({
            data: entity.fields.map(f => ({
              dataEntityId: createdEntity.id,
              name: f.name,
              dataType: (f.dataType as any) || 'UNKNOWN',
              isNullable: f.isNullable ?? true,
              isPrimaryKey: f.isPrimaryKey ?? false,
            })),
          });
        }
      }

      return tx.dataModel.findUnique({
        where: { id: dataModel.id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            include: {
              entities: {
                include: {
                  fields: true,
                },
              },
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`DataModel not found after creation`);
    }

    return result as DataModelResponse;
  }

  async findAll(connectionId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<DataModelResponse>> {
    await this.verifyConnectionAccess(connectionId, user.id);

    const where = { connectionId, deletedAt: null };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.dataModel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            include: {
              entities: {
                include: {
                  fields: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.dataModel.count({ where }),
    ]);

    return {
      data: data as DataModelResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<DataModelResponse> {
    const dataModel = await this.prisma.dataModel.findFirst({
      where: { id, deletedAt: null },
      include: {
        connection: true,
        versions: {
          orderBy: { version: 'desc' },
          include: {
            entities: {
              include: {
                fields: true,
              },
            },
          },
        },
      },
    });

    if (!dataModel) {
      throw new NotFoundException(`DataModel ${id} not found`);
    }

    await this.verifyConnectionAccess(dataModel.connectionId, user.id);

    return dataModel;
  }

  async updateDraft(id: string, dto: UpdateDataModelDto, user: RequestUser): Promise<DataModelResponse> {
    const dataModel = await this.findOne(id, user);

    const latestVersion = (dataModel as any).versions[0];
    if (!latestVersion || latestVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot update DataModel ${id}: no DRAFT version exists. Create a new draft first.`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.name) {
        await tx.dataModel.update({
          where: { id },
          data: { name: dto.name, description: dto.description },
        });
      }

      if (dto.entities) {
        await tx.dataEntity.deleteMany({
          where: { dataModelVersionId: latestVersion.id },
        });

        for (const entity of dto.entities) {
          const createdEntity = await tx.dataEntity.create({
            data: {
              dataModelVersionId: latestVersion.id,
              name: entity.name,
              description: entity.description,
            },
          });

          if (entity.fields && entity.fields.length > 0) {
            await tx.dataField.createMany({
              data: entity.fields.map(f => ({
                dataEntityId: createdEntity.id,
                name: f.name,
                dataType: (f.dataType as any) || 'UNKNOWN',
                isNullable: f.isNullable ?? true,
                isPrimaryKey: f.isPrimaryKey ?? false,
              })),
            });
          }
        }
      }

      return tx.dataModel.findUnique({
        where: { id },
        include: {
          versions: {
            where: { id: latestVersion.id },
            include: {
              entities: {
                include: {
                  fields: true,
                },
              },
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`DataModel not found after update`);
    }

    return result as DataModelResponse;
  }

  async publishVersion(dataModelId: string, versionId: string, user: RequestUser): Promise<DataModelVersionResponse> {
    const dataModel = await this.findOne(dataModelId, user);

    const targetVersion = (dataModel as any).versions.find((v: any) => v.id === versionId);
    if (!targetVersion) {
      throw new NotFoundException(`DataModelVersion ${versionId} not found for DataModel ${dataModelId}`);
    }

    if (targetVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT version can be published. Version ${versionId} has status '${targetVersion.status}'.`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.dataModelVersion.updateMany({
        where: {
          dataModelId,
          status: 'PUBLISHED',
        },
        data: {
          status: 'SUPERSEDED',
        },
      });

      const published = await tx.dataModelVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
        },
        include: {
          entities: {
            include: {
              fields: true,
            },
          },
        },
      });

      return published;
    });
  }
}
