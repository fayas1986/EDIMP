import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreateValidationSetDto, UpdateValidationDraftDto, PaginationQueryDto, PaginatedResult, ValidationSetResponse, ValidationVersionResponse } from '@edimp/contracts';
import * as crypto from 'crypto';

@Injectable()
export class ValidationsService {
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

  private computeDefinitionHash(rules: any[]): string {
    const sorted = [...rules].sort((a, b) =>
      a.targetFieldIdentifier.localeCompare(b.targetFieldIdentifier)
    );
    const serialized = JSON.stringify(sorted);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  async create(workspaceId: string, dto: CreateValidationSetDto, user: RequestUser): Promise<ValidationSetResponse> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const existing = await this.prisma.validationSet.findFirst({
      where: {
        workspaceId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`ValidationSet with name '${dto.name}' already exists in this workspace`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const set = await tx.validationSet.create({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
        },
      });

      const version = await tx.validationVersion.create({
        data: {
          validationSetId: set.id,
          version: 1,
          status: 'DRAFT',
        },
      });

      if (dto.rules && dto.rules.length > 0) {
        await tx.fieldValidationRule.createMany({
          data: dto.rules.map((r) => ({
            validationVersionId: version.id,
            targetFieldIdentifier: r.targetFieldIdentifier,
            ruleType: r.ruleType as any,
            ruleConfig: r.ruleConfig || {},
            severity: (r.severity as any) || 'ERROR',
          })),
        });
      }

      return tx.validationSet.findUnique({
        where: { id: set.id },
        include: {
          versions: {
            include: {
              rules: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`ValidationSet not found after creation`);
    }

    return result as any as ValidationSetResponse;
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<ValidationSetResponse>> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const where = { workspaceId, deletedAt: null };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [data, totalItems] = await Promise.all([
      this.prisma.validationSet.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            include: {
              rules: true,
            },
          },
        },
      }),
      this.prisma.validationSet.count({ where }),
    ]);

    return {
      data: data as any as ValidationSetResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<ValidationSetResponse> {
    const set = await this.prisma.validationSet.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            rules: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException(`ValidationSet ${id} not found`);
    }

    await this.verifyWorkspaceAccess(set.workspaceId, user.id);

    return set as any as ValidationSetResponse;
  }

  async updateDraft(id: string, dto: UpdateValidationDraftDto, user: RequestUser): Promise<ValidationSetResponse> {
    const set = await this.findOne(id, user);

    const latestVersion = (set as any).versions[0];
    if (!latestVersion || latestVersion.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot update ValidationSet ${id}: no DRAFT version exists. Create a new draft first.`
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.name || dto.description !== undefined) {
        await tx.validationSet.update({
          where: { id },
          data: {
            ...(dto.name ? { name: dto.name } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
          },
        });
      }

      if (dto.rules) {
        await tx.fieldValidationRule.deleteMany({
          where: { validationVersionId: latestVersion.id },
        });

        if (dto.rules.length > 0) {
          await tx.fieldValidationRule.createMany({
            data: dto.rules.map((r) => ({
              validationVersionId: latestVersion.id,
              targetFieldIdentifier: r.targetFieldIdentifier,
              ruleType: r.ruleType as any,
              ruleConfig: r.ruleConfig || {},
              severity: (r.severity as any) || 'ERROR',
            })),
          });
        }
      }

      return tx.validationSet.findUnique({
        where: { id },
        include: {
          versions: {
            where: { id: latestVersion.id },
            include: {
              rules: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new NotFoundException(`ValidationSet not found after update`);
    }

    return result as any as ValidationSetResponse;
  }

  // Atomic pessimistic publication: SELECT parent FOR UPDATE -> validate DRAFT -> supersede PUBLISHED -> publish
  async publishVersion(validationSetId: string, versionId: string, user: RequestUser): Promise<ValidationVersionResponse> {
    const set = await this.findOne(validationSetId, user);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic row locking on parent ValidationSet
      await tx.$executeRawUnsafe(
        `SELECT id FROM "ValidationSet" WHERE id = $1 FOR UPDATE`,
        validationSetId
      );

      const targetVersion = await tx.validationVersion.findFirst({
        where: { id: versionId, validationSetId },
        include: { rules: true },
      });

      if (!targetVersion) {
        throw new NotFoundException(
          `ValidationVersion ${versionId} not found for ValidationSet ${validationSetId}`
        );
      }

      if (targetVersion.status !== 'DRAFT') {
        throw new BadRequestException(
          `Only DRAFT version can be published. Version ${versionId} has status '${targetVersion.status}'.`
        );
      }

      // 2. Compute definition hash
      const definitionHash = this.computeDefinitionHash(targetVersion.rules);

      // 3. Mark existing PUBLISHED version as SUPERSEDED
      await tx.validationVersion.updateMany({
        where: { validationSetId, status: 'PUBLISHED' },
        data: { status: 'SUPERSEDED' },
      });

      // 4. Mark target DRAFT version as PUBLISHED
      const published = await tx.validationVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          definitionHash,
          publishedAt: new Date(),
          publishedByUserId: user.id,
        },
        include: {
          rules: true,
        },
      });

      return published;
    });

    return result as any as ValidationVersionResponse;
  }
}
