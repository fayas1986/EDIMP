import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MigrationEngineService } from '../migration-engine/migration-engine.service';
import {
  UpdateErrorStatusDto,
  ResolveErrorOverrideDto,
  ResolveErrorReplayDto,
  BulkResolveErrorsDto,
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

  async listErrors(workspaceId: string, status?: ErrorResolutionStatus, category?: string) {
    return this.prisma.recordError.findMany({
      where: {
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
      },
      include: {
        migrationRecord: true,
        manualOverride: true,
        resolutionLogs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getErrorDetails(errorId: string) {
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
    return error;
  }

  async updateStatus(errorId: string, userId: string, dto: UpdateErrorStatusDto) {
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

    return updated;
  }

  async applyManualOverride(errorId: string, userId: string, dto: ResolveErrorOverrideDto) {
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

    return override;
  }

  async replayError(errorId: string, userId: string, dto: ResolveErrorReplayDto) {
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

  async bulkResolveErrors(userId: string, dto: BulkResolveErrorsDto) {
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
