import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MigrationEngineService } from '../migration-engine/migration-engine.service';
import {
  UpdateErrorStatusDto,
  ResolveErrorOverrideDto,
  ResolveErrorReplayDto,
  BulkResolveErrorsDto,
  PaginationQueryDto,
  PaginatedResult,
  RecordErrorResponse,
  ErrorManualOverrideResponse,
  ErrorReplayResponse,
  BulkResolveErrorsResponse,
} from '@edimp/contracts';
import {
  ErrorResolutionStatus,
  ErrorResolutionAction,
} from '@edimp/database';

@Injectable()
export class ErrorManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly migrationEngineService: MigrationEngineService
  ) {}

  private async verifyErrorAccess(errorId: string, user: any) {
    const error = await this.prisma.recordError.findUnique({
      where: { id: errorId },
      include: {
        migrationRecord: {
          include: {
            migrationRun: {
              include: {
                migrationConfigVersion: {
                  include: {
                    migrationJob: {
                      include: {
                        workspace: {
                          include: {
                            members: {
                              where: { userId: user.id },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!error) {
      throw new NotFoundException(`Record error ${errorId} not found`);
    }

    const hasAccess = error.migrationRecord.migrationRun.migrationConfigVersion.migrationJob.workspace.members.length > 0;
    if (!hasAccess) {
      throw new ForbiddenException(`User does not have access to RecordError ${errorId}`);
    }

    return error;
  }

  async listErrors(
    workspaceId: string,
    query?: PaginationQueryDto & { status?: ErrorResolutionStatus; category?: string }
  ): Promise<PaginatedResult<RecordErrorResponse>> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const status = query?.status;
    const category = query?.category;

    const where = {
      resolutionStatus: status ? status : undefined,
      errorCategory: category ? (category as any) : undefined,
      migrationRecord: {
        jobBatch: {
          migrationRun: {
            migrationConfigVersion: {
              migrationJob: {
                workspaceId,
              },
            },
          },
        },
      },
    };

    const [data, totalItems] = await Promise.all([
      this.prisma.recordError.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          migrationRecord: true,
          manualOverride: true,
          resolutionLogs: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recordError.count({ where }),
    ]);

    return {
      data: data as any as RecordErrorResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async getErrorDetails(errorId: string, user: any): Promise<RecordErrorResponse> {
    await this.verifyErrorAccess(errorId, user);
    const error = await this.prisma.recordError.findUnique({
      where: { id: errorId },
      include: {
        migrationRecord: {
          include: {
            migrationRun: true,
          },
        },
        manualOverride: true,
        resolutionLogs: true,
      },
    });
    if (!error) throw new NotFoundException('Record error not found');
    return error as any as RecordErrorResponse;
  }

  async updateStatus(errorId: string, userId: string, dto: UpdateErrorStatusDto): Promise<RecordErrorResponse> {
    await this.verifyErrorAccess(errorId, { id: userId });
    const error = await this.prisma.recordError.findUnique({ where: { id: errorId } });
    if (!error) throw new NotFoundException('Record error not found');

    const fromStatus = error.resolutionStatus;
    const toStatus = dto.status as ErrorResolutionStatus;

    const updated = await this.prisma.recordError.update({
      where: { id: errorId },
      data: {
        resolutionStatus: toStatus,
        assignedToUserId: dto.assignedToUserId ?? error.assignedToUserId,
      },
    });

    await this.prisma.errorResolutionLog.create({
      data: {
        recordErrorId: errorId,
        action: ErrorResolutionAction.INVESTIGATE,
        fromStatus,
        toStatus,
        performedByUserId: userId,
        details: dto.details ?? {},
      },
    });

    return updated as any as RecordErrorResponse;
  }

  async applyManualOverride(errorId: string, userId: string, dto: ResolveErrorOverrideDto): Promise<ErrorManualOverrideResponse> {
    await this.verifyErrorAccess(errorId, { id: userId });
    const error = await this.prisma.recordError.findUnique({
      where: { id: errorId },
      include: { migrationRecord: true, manualOverride: true },
    });
    if (!error) throw new NotFoundException('Record error not found');

    const originalPayload = (error.sanitizedDiagnostics as Record<string, any>)?.payload || {};
    const fromStatus = error.resolutionStatus;
    const toStatus = ErrorResolutionStatus.RESOLVED_MANUAL_OVERRIDE;

    // Upsert manual override non-destructively
    const override = await this.prisma.errorManualOverride.upsert({
      where: { recordErrorId: errorId },
      create: {
        recordErrorId: errorId,
        originalPayload,
        overridePayload: dto.overridePayload,
        overrideReason: dto.overrideReason,
        overriddenByUserId: userId,
      },
      update: {
        overridePayload: dto.overridePayload,
        overrideReason: dto.overrideReason,
        overriddenByUserId: userId,
      },
    });

    await this.prisma.recordError.update({
      where: { id: errorId },
      data: {
        resolutionStatus: toStatus,
        resolvedByUserId: userId,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.errorResolutionLog.create({
      data: {
        recordErrorId: errorId,
        action: ErrorResolutionAction.MANUAL_OVERRIDE,
        fromStatus,
        toStatus,
        performedByUserId: userId,
        details: { overrideReason: dto.overrideReason },
      },
    });

    return override as any as ErrorManualOverrideResponse;
  }

  async replayError(errorId: string, userId: string, dto: ResolveErrorReplayDto): Promise<ErrorReplayResponse> {
    await this.verifyErrorAccess(errorId, { id: userId });
    const error = await this.prisma.recordError.findUnique({
      where: { id: errorId },
      include: {
        manualOverride: true,
        migrationRecord: {
          include: {
            jobBatch: {
              include: {
                migrationRun: {
                  include: {
                    migrationConfigVersion: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!error) throw new NotFoundException('Record error not found');

    let payloadToReplay: Record<string, any>;

    if (dto.overridePayload) {
      await this.applyManualOverride(errorId, userId, {
        overridePayload: dto.overridePayload,
        overrideReason: dto.overrideReason || 'Replay with override payload',
      });
      payloadToReplay = dto.overridePayload;
    } else if (error.manualOverride) {
      payloadToReplay = error.manualOverride.overridePayload as Record<string, any>;
    } else {
      payloadToReplay = (error.sanitizedDiagnostics as Record<string, any>)?.payload || {};
    }

    const migrationRun = error.migrationRecord.jobBatch.migrationRun;
    const configVer = migrationRun.migrationConfigVersion;

    // Trigger replay via Phase 5 Migration Engine without mutating original MigrationRecord
    const newRun = await this.migrationEngineService.triggerRun(
      configVer.migrationJobId,
      {
        batchSize: 1,
        loadStrategy: 'UPSERT' as any,
        samplePayloads: [payloadToReplay],
      },
      { id: userId, tenantId: 'tenant-1', roles: ['ADMIN'] } as any
    );

    const fromStatus = error.resolutionStatus;
    const toStatus = ErrorResolutionStatus.RESOLVED_REPLAYED;

    await this.prisma.recordError.update({
      where: { id: errorId },
      data: {
        resolutionStatus: toStatus,
        resolvedByUserId: userId,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.errorResolutionLog.create({
      data: {
        recordErrorId: errorId,
        action: ErrorResolutionAction.REPLAY,
        fromStatus,
        toStatus,
        performedByUserId: userId,
        details: { replayRunId: newRun.id },
      },
    });

    return { errorId, status: toStatus, replayRunId: newRun.id };
  }

  async bulkResolveErrors(userId: string, dto: BulkResolveErrorsDto): Promise<BulkResolveErrorsResponse> {
    const results = [];
    for (const errorId of dto.recordErrorIds) {
      if (dto.action === ErrorResolutionAction.REPLAY) {
        const res = await this.replayError(errorId, userId, {
          overrideReason: dto.overrideReason,
        });
        results.push(res);
      } else if (dto.action === ErrorResolutionAction.IGNORE) {
        const error = await this.prisma.recordError.findUnique({ where: { id: errorId } });
        if (error) {
          await this.prisma.recordError.update({
            where: { id: errorId },
            data: { resolutionStatus: ErrorResolutionStatus.IGNORED },
          });
          await this.prisma.errorResolutionLog.create({
            data: {
              recordErrorId: errorId,
              action: ErrorResolutionAction.IGNORE,
              fromStatus: error.resolutionStatus,
              toStatus: ErrorResolutionStatus.IGNORED,
              performedByUserId: userId,
              details: { reason: dto.overrideReason },
            },
          });
          results.push({ errorId, status: ErrorResolutionStatus.IGNORED });
        }
      }
    }
    return { status: 202, message: 'Bulk error resolution queued', results };
  }
}
