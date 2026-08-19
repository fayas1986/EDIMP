import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateMappingSetDto, UpdateMappingDraftDto, PaginationQueryDto, PaginatedResult } from '@edimp/contracts';
import { MappingValidatorService } from './mapping-validator.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MappingSetsService {
  constructor(
    private prisma: PrismaService,
    private validator: MappingValidatorService,
  ) {}

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

  // Deterministic SHA-256 hash calculation of canonicalized mapping (sorted keys, no timestamps/volatile IDs)
  private computeDefinitionHash(entityMappings: any[]): string {
    const canonicalized = (entityMappings || []).map(em => ({
      sourceEntityId: em.sourceEntityId || '',
      canonicalEntityId: em.canonicalEntityId || '',
      targetEntityId: em.targetEntityId || '',
      fieldMappings: (em.fieldMappings || []).map((fm: any) => ({
        sourceFieldId: fm.sourceFieldId || '',
        canonicalFieldId: fm.canonicalFieldId || '',
        targetFieldId: fm.targetFieldId || '',
        transformType: fm.transformType,
        config: fm.config || {},
      })).sort((a: any, b: any) => 
        (a.canonicalFieldId + a.sourceFieldId + a.targetFieldId).localeCompare(
          b.canonicalFieldId + b.sourceFieldId + b.targetFieldId
        )
      ),
    })).sort((a: any, b: any) => 
      (a.canonicalEntityId + a.sourceEntityId + a.targetEntityId).localeCompare(
        b.canonicalEntityId + b.sourceEntityId + b.targetEntityId
      )
    );

    return crypto.createHash('sha256').update(JSON.stringify(canonicalized)).digest('hex');
  }

  async create(workspaceId: string, dto: CreateMappingSetDto, user: RequestUser) {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const existing = await this.prisma.mappingSet.findFirst({
      where: { workspaceId, name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(`MappingSet with name '${dto.name}' already exists in this workspace`);
    }

    // Verify DataModelVersion & CanonicalModelVersion belong to the same workspace
    const canonicalVer = await this.prisma.canonicalModelVersion.findUnique({
      where: { id: dto.canonicalModelVersionId },
      include: { canonicalModel: true },
    });

    if (!canonicalVer || canonicalVer.canonicalModel.workspaceId !== workspaceId) {
      throw new BadRequestException(`CanonicalModelVersion ${dto.canonicalModelVersionId} invalid or does not belong to workspace ${workspaceId}`);
    }

    const dataModelVer = await this.prisma.dataModelVersion.findUnique({
      where: { id: dto.dataModelVersionId },
      include: { dataModel: { include: { connection: { include: { environment: true } } } } },
    });

    if (!dataModelVer || dataModelVer.dataModel.connection.environment.workspaceId !== workspaceId) {
      throw new BadRequestException(`DataModelVersion ${dto.dataModelVersionId} invalid or does not belong to workspace ${workspaceId}`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const mappingSet = await tx.mappingSet.create({
          data: {
            workspaceId,
            name: dto.name,
            description: dto.description,
            direction: dto.direction,
          },
        });

        const version = await tx.mappingVersion.create({
          data: {
            mappingSetId: mappingSet.id,
            canonicalModelVersionId: dto.canonicalModelVersionId,
            dataModelVersionId: dto.dataModelVersionId,
            version: 1,
            status: 'DRAFT',
          },
        });

        for (const em of dto.entityMappings || []) {
          const createdEm = await tx.entityMapping.create({
            data: {
              mappingVersionId: version.id,
              sourceEntityId: em.sourceEntityId,
              canonicalEntityId: em.canonicalEntityId,
              targetEntityId: em.targetEntityId,
            },
          });

          if (em.fieldMappings && em.fieldMappings.length > 0) {
            await tx.fieldMapping.createMany({
              data: em.fieldMappings.map(fm => ({
                entityMappingId: createdEm.id,
                sourceFieldId: fm.sourceFieldId,
                canonicalFieldId: fm.canonicalFieldId,
                targetFieldId: fm.targetFieldId,
                transformType: fm.transformType || 'DIRECT',
                config: fm.config || {},
              })),
            });
          }
        }

        return tx.mappingSet.findUnique({
          where: { id: mappingSet.id },
          include: {
            versions: {
              include: {
                entityMappings: {
                  include: { fieldMappings: true },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Invalid entity or field reference: referenced entity/field does not exist');
      }
      throw error;
    }
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<any[] | PaginatedResult<any>> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const where = { workspaceId, deletedAt: null };

    if (!query?.page && !query?.pageSize) {
      return this.prisma.mappingSet.findMany({
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
      this.prisma.mappingSet.findMany({
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
      this.prisma.mappingSet.count({ where }),
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
    const set = await this.prisma.mappingSet.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            entityMappings: {
              include: { fieldMappings: true },
            },
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException(`MappingSet ${id} not found`);
    }

    await this.verifyWorkspaceAccess(set.workspaceId, user.id);
    return set;
  }

  async updateDraft(id: string, dto: UpdateMappingDraftDto, user: RequestUser) {
    const set = await this.findOne(id, user);

    const latestVersion = set.versions[0];
    if (!latestVersion || latestVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot update MappingSet ${id}: no DRAFT version exists. Published/Superseded versions are immutable.`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.name) {
          await tx.mappingSet.update({
            where: { id },
            data: { name: dto.name, description: dto.description },
          });
        }

        if (dto.entityMappings) {
          // Delete old draft mappings
          const oldEms = await tx.entityMapping.findMany({
            where: { mappingVersionId: latestVersion.id },
            select: { id: true },
          });
          const oldEmIds = oldEms.map(e => e.id);

          if (oldEmIds.length > 0) {
            await tx.fieldMapping.deleteMany({
              where: { entityMappingId: { in: oldEmIds } },
            });
            await tx.entityMapping.deleteMany({
              where: { mappingVersionId: latestVersion.id },
            });
          }

          for (const em of dto.entityMappings) {
            const createdEm = await tx.entityMapping.create({
              data: {
                mappingVersionId: latestVersion.id,
                sourceEntityId: em.sourceEntityId,
                canonicalEntityId: em.canonicalEntityId,
                targetEntityId: em.targetEntityId,
              },
            });

            if (em.fieldMappings && em.fieldMappings.length > 0) {
              await tx.fieldMapping.createMany({
                data: em.fieldMappings.map(fm => ({
                  entityMappingId: createdEm.id,
                  sourceFieldId: fm.sourceFieldId,
                  canonicalFieldId: fm.canonicalFieldId,
                  targetFieldId: fm.targetFieldId,
                  transformType: fm.transformType || 'DIRECT',
                  config: fm.config || {},
                })),
              });
            }
          }
        }

        return tx.mappingSet.findUnique({
          where: { id },
          include: {
            versions: {
              where: { id: latestVersion.id },
              include: {
                entityMappings: {
                  include: { fieldMappings: true },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Invalid entity or field reference: referenced entity/field does not exist');
      }
      throw error;
    }
  }

  // Requirement 8: Pessimistic locking publish transaction with SELECT FOR UPDATE + MappingValidator
  async publishVersion(mappingSetId: string, versionId: string, user: RequestUser) {
    const set = await this.findOne(mappingSetId, user);

    const targetVersion = set.versions.find(v => v.id === versionId);
    if (!targetVersion) {
      throw new NotFoundException(`MappingVersion ${versionId} not found`);
    }

    if (targetVersion.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT version can be published. Version ${versionId} is '${targetVersion.status}'.`);
    }

    // Pre-publication Validation
    await this.validator.validateMappingVersionForPublication(versionId);

    const definitionHash = this.computeDefinitionHash(targetVersion.entityMappings || []);

    return this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Lock on MappingSet (SELECT FOR UPDATE)
      await tx.$executeRawUnsafe(
        `SELECT id FROM "MappingSet" WHERE id = $1 FOR UPDATE`,
        mappingSetId
      );

      // 2. Mark existing PUBLISHED version as SUPERSEDED
      await tx.mappingVersion.updateMany({
        where: {
          mappingSetId,
          status: 'PUBLISHED',
        },
        data: {
          status: 'SUPERSEDED',
        },
      });

      // 3. Promote target DRAFT version to PUBLISHED
      const published = await tx.mappingVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedByUserId: user.id,
          definitionHash,
        },
        include: {
          entityMappings: {
            include: { fieldMappings: true },
          },
        },
      });

      return published;
    });
  }
}
