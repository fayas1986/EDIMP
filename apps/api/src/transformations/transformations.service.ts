import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateTransformationSetDto, UpdateTransformationDraftDto, PaginationQueryDto, PaginatedResult, TransformationSetResponse, TransformationVersionResponse } from '@edimp/contracts';
import * as crypto from 'crypto';

@Injectable()
export class TransformationsService {
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

  private computeDefinitionHash(fieldTransformations: any[]): string {
    const sorted = [...fieldTransformations].sort((a, b) =>
      a.targetFieldIdentifier.localeCompare(b.targetFieldIdentifier)
    );
    const serialized = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  async create(workspaceId: string, dto: CreateTransformationSetDto, user: RequestUser): Promise<TransformationSetResponse> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const existing = await this.prisma.transformationSet.findFirst({
      where: {
        workspaceId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`TransformationSet with name '${dto.name}' already exists in this workspace`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const set = await tx.transformationSet.create({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
        },
      });

      const version = await tx.transformationVersion.create({
        data: {
          transformationSetId: set.id,
          version: 1,
          status: 'DRAFT',
        },
      });

      if (dto.fieldTransformations && dto.fieldTransformations.length > 0) {
        await tx.fieldTransformation.createMany({
          data: dto.fieldTransformations.map((t) => ({
            transformationVersionId: version.id,
            targetFieldIdentifier: t.targetFieldIdentifier,
            transformType: t.transformType as any,
            config: t.config || {},
          })),
        });
      }

      return tx.transformationSet.findUnique({
        where: { id: set.id },
        include: {
          versions: {
            include: {
              fieldTransformations: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`TransformationSet not found after creation`);
    }

    return result as any as TransformationSetResponse;
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<TransformationSetResponse>> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const where = { workspaceId, deletedAt: null };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.transformationSet.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            include: {
              fieldTransformations: true,
            },
          },
        },
      }),
      this.prisma.transformationSet.count({ where }),
    ]);

    return {
      data: data as any as TransformationSetResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<TransformationSetResponse> {
    const set = await this.prisma.transformationSet.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            fieldTransformations: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException(`TransformationSet ${id} not found`);
    }

    await this.verifyWorkspaceAccess(set.workspaceId, user.id);

    return set as any as TransformationSetResponse;
  }

  async updateDraft(id: string, dto: UpdateTransformationDraftDto, user: RequestUser): Promise<TransformationSetResponse> {
    const set = await this.findOne(id, user);

    const latestVersion = (set as any).versions[0];
    if (!latestVersion || latestVersion.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot update TransformationSet ${id}: no DRAFT version exists. Create a new draft first.`
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.name || dto.description !== undefined) {
        await tx.transformationSet.update({
          where: { id },
          data: {
            ...(dto.name ? { name: dto.name } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
          },
        });
      }

      if (dto.fieldTransformations) {
        await tx.fieldTransformation.deleteMany({
          where: { transformationVersionId: latestVersion.id },
        });

        if (dto.fieldTransformations.length > 0) {
          await tx.fieldTransformation.createMany({
            data: dto.fieldTransformations.map((t) => ({
              transformationVersionId: latestVersion.id,
              targetFieldIdentifier: t.targetFieldIdentifier,
              transformType: t.transformType as any,
              config: t.config || {},
            })),
          });
        }
      }

      return tx.transformationSet.findUnique({
        where: { id },
        include: {
          versions: {
            where: { id: latestVersion.id },
            include: {
              fieldTransformations: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`TransformationSet not found after update`);
    }

    return result as any as TransformationSetResponse;
  }

  // Atomic pessimistic publication: SELECT parent FOR UPDATE -> validate DRAFT -> supersede PUBLISHED -> publish
  async publishVersion(transformationSetId: string, versionId: string, user: RequestUser): Promise<TransformationVersionResponse> {
    const set = await this.findOne(transformationSetId, user);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic row locking on parent TransformationSet
      await tx.$executeRawUnsafe(
        `SELECT id FROM "TransformationSet" WHERE id = $1 FOR UPDATE`,
        transformationSetId
      );

      const targetVersion = await tx.transformationVersion.findFirst({
        where: { id: versionId, transformationSetId },
        include: { fieldTransformations: true },
      });

      if (!targetVersion) {
        throw new NotFoundException(
          `TransformationVersion ${versionId} not found for TransformationSet ${transformationSetId}`
        );
      }

      if (targetVersion.status !== 'DRAFT') {
        throw new BadRequestException(
          `Only DRAFT version can be published. Version ${versionId} has status '${targetVersion.status}'.`
        );
      }

      // 2. Compute definition hash
      const definitionHash = this.computeDefinitionHash(targetVersion.fieldTransformations);

      // 3. Mark existing PUBLISHED version as SUPERSEDED
      await tx.transformationVersion.updateMany({
        where: { transformationSetId, status: 'PUBLISHED' },
        data: { status: 'SUPERSEDED' },
      });

      // 4. Mark target DRAFT version as PUBLISHED
      const published = await tx.transformationVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          definitionHash,
          publishedAt: new Date(),
          publishedByUserId: user.id,
        },
        include: {
          fieldTransformations: true,
        },
      });

      return published;
    });

    return result as any as TransformationVersionResponse;
  }
}
