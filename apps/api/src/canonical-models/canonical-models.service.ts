import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateCanonicalModelDto, UpdateCanonicalModelDto, PaginationQueryDto, PaginatedResult, CanonicalModel } from '@edimp/contracts';
import * as crypto from 'crypto';

@Injectable()
export class CanonicalModelsService {
  constructor(private prisma: PrismaService) {}

  private async verifyWorkspaceAccess(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      include: {
        tenant: {
          include: {
            members: { where: { userId } },
          },
        },
        members: { where: { userId } },
      },
    });

    if (!workspace || workspace.tenant.deletedAt) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    const hasTenantAccess = workspace.tenant.members.length > 0;
    const hasWorkspaceAccess = workspace.members.length > 0;

    if (!hasTenantAccess && !hasWorkspaceAccess) {
      throw new ForbiddenException(`User does not have access to Workspace ${workspaceId}`);
    }

    return workspace;
  }

  // Compute deterministic SHA-256 hash for canonical model version
  private computeDefinitionHash(entities: any[]): string {
    const canonicalized = entities.map(e => ({
      name: e.name,
      description: e.description || '',
      fields: (e.fields || []).map((f: any) => ({
        name: f.name,
        dataType: f.dataType,
        isNullable: f.isNullable,
        isPrimaryKey: f.isPrimaryKey,
      })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return crypto.createHash('sha256').update(JSON.stringify(canonicalized)).digest('hex');
  }

  async create(workspaceId: string, dto: CreateCanonicalModelDto, user: RequestUser) {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const existing = await this.prisma.canonicalModel.findFirst({
      where: { workspaceId, name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(`CanonicalModel with name '${dto.name}' already exists in this workspace`);
    }

    return this.prisma.$transaction(async (tx) => {
      const canonicalModel = await tx.canonicalModel.create({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
        },
      });

      const version = await tx.canonicalModelVersion.create({
        data: {
          canonicalModelId: canonicalModel.id,
          version: 1,
          status: 'DRAFT',
        },
      });

      for (const entity of dto.entities || []) {
        const createdEntity = await tx.canonicalEntity.create({
          data: {
            canonicalModelVersionId: version.id,
            name: entity.name,
            description: entity.description,
          },
        });

        if (entity.fields && entity.fields.length > 0) {
          await tx.canonicalField.createMany({
            data: entity.fields.map(f => ({
              canonicalEntityId: createdEntity.id,
              name: f.name,
              dataType: (f.dataType as any) || 'UNKNOWN',
              isNullable: f.isNullable ?? true,
              isPrimaryKey: f.isPrimaryKey ?? false,
            })),
          });
        }
      }

      return tx.canonicalModel.findUnique({
        where: { id: canonicalModel.id },
        include: {
          versions: {
            include: {
              entities: {
                include: { fields: true },
              },
            },
          },
        },
      });
    });
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<any[] | PaginatedResult<any>> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const where = { workspaceId, deletedAt: null };

    if (!query?.page && !query?.pageSize) {
      return this.prisma.canonicalModel.findMany({
        where,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      });
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.canonicalModel.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.canonicalModel.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async findOne(id: string, user: RequestUser) {
    const model = await this.prisma.canonicalModel.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            entities: {
              include: { fields: true },
            },
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException(`CanonicalModel ${id} not found`);
    }

    await this.verifyWorkspaceAccess(model.workspaceId, user.id);
    return model;
  }

  async updateDraft(id: string, dto: UpdateCanonicalModelDto, user: RequestUser) {
    const model = await this.findOne(id, user);

    const latestVersion = model.versions[0];
    if (!latestVersion || latestVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot update CanonicalModel ${id}: no DRAFT version exists. Modifying published versions is prohibited.`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.name) {
        await tx.canonicalModel.update({
          where: { id },
          data: { name: dto.name, description: dto.description },
        });
      }

      if (dto.entities) {
        await tx.canonicalEntity.deleteMany({
          where: { canonicalModelVersionId: latestVersion.id },
        });

        for (const entity of dto.entities) {
          const createdEntity = await tx.canonicalEntity.create({
            data: {
              canonicalModelVersionId: latestVersion.id,
              name: entity.name,
              description: entity.description,
            },
          });

          if (entity.fields && entity.fields.length > 0) {
            await tx.canonicalField.createMany({
              data: entity.fields.map(f => ({
                canonicalEntityId: createdEntity.id,
                name: f.name,
                dataType: (f.dataType as any) || 'UNKNOWN',
                isNullable: f.isNullable ?? true,
                isPrimaryKey: f.isPrimaryKey ?? false,
              })),
            });
          }
        }
      }

      return tx.canonicalModel.findUnique({
        where: { id },
        include: {
          versions: {
            where: { id: latestVersion.id },
            include: {
              entities: {
                include: { fields: true },
              },
            },
          },
        },
      });
    });
  }

  async publishVersion(canonicalModelId: string, versionId: string, user: RequestUser) {
    const model = await this.findOne(canonicalModelId, user);

    const targetVersion = model.versions.find(v => v.id === versionId);
    if (!targetVersion) {
      throw new NotFoundException(`CanonicalModelVersion ${versionId} not found`);
    }

    if (targetVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT version can be published. Version ${versionId} is '${targetVersion.status}'.`);
    }

    const definitionHash = this.computeDefinitionHash(targetVersion.entities || []);

    return this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Lock on CanonicalModel to prevent race conditions
      await tx.$executeRawUnsafe(
        `SELECT id FROM "CanonicalModel" WHERE id = $1 FOR UPDATE`,
        canonicalModelId
      );

      // 2. Mark current PUBLISHED version as SUPERSEDED
      await tx.canonicalModelVersion.updateMany({
        where: {
          canonicalModelId,
          status: 'PUBLISHED',
        },
        data: {
          status: 'SUPERSEDED',
        },
      });

      // 3. Promote requested DRAFT version to PUBLISHED
      const published = await tx.canonicalModelVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId: user.id,
          definitionHash,
        },
        include: {
          entities: {
            include: { fields: true },
          },
        },
      });

      return published;
    });
  }
}
