import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CanonicalJsonService } from './canonical-json.service';
import { SourceExtractorService } from './source-extractor.service';
import { TargetLoaderService } from './target-loader.service';
import { RetryStrategyService } from './retry-strategy.service';
import { MigrationValidationService } from './migration-validation.service';
import { TransformationEngineService } from '../transformations/transformation-engine.service';
import { ValidationEngineService } from '../validations/validation-engine.service';
import {
  CreateMigrationJobDto,
  CreateMigrationConfigVersionDto,
  TriggerMigrationRunDto,
  RetryMigrationRunDto,
  ResumeMigrationRunDto,
  PaginationQueryDto,
  PaginatedResult,
  TransformationContext,
} from '@edimp/contracts';
import {
  MigrationConfigVersionStatus,
  MigrationRunStatus,
  BatchStatus,
  RecordStatus,
  LoadOperation,
  LoadStrategy,
  ErrorCategory,
} from '@edimp/database';
import * as crypto from 'crypto';

@Injectable()
export class MigrationEngineService {
  private readonly migrationQueue: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly canonicalJsonService: CanonicalJsonService,
    private readonly sourceExtractorService: SourceExtractorService,
    private readonly targetLoaderService: TargetLoaderService,
    private readonly retryStrategyService: RetryStrategyService,
    private readonly migrationValidationService: MigrationValidationService,
    private readonly transformationEngineService: TransformationEngineService,
    private readonly validationEngineService: ValidationEngineService,
  ) {}

  private async checkWorkspaceAccess(workspaceId: string, user: RequestUser): Promise<void> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });
    if (!membership) {
      throw new ForbiddenException(`User does not have access to workspace ${workspaceId}`);
    }
  }

  /**
   * 1. Create MigrationJob
   */
  async createJob(workspaceId: string, dto: CreateMigrationJobDto, user: RequestUser): Promise<any> {
    await this.checkWorkspaceAccess(workspaceId, user);
    await this.migrationValidationService.validateJobCreation(workspaceId, dto.environmentId);

    const existing = await this.prisma.migrationJob.findFirst({
      where: { workspaceId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`MigrationJob with name '${dto.name}' already exists in workspace`);
    }

    return this.prisma.migrationJob.create({
      data: {
        workspaceId,
        environmentId: dto.environmentId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  /**
   * 2. List MigrationJobs in Workspace
   */
  async findAllJobs(
    workspaceId: string,
    user: RequestUser,
    query?: PaginationQueryDto,
  ): Promise<any> {
    await this.checkWorkspaceAccess(workspaceId, user);

    if (query?.page && query?.pageSize) {
      const page = Number(query.page);
      const pageSize = Number(query.pageSize);
      const skip = (page - 1) * pageSize;

      const [items, totalItems] = await Promise.all([
        this.prisma.migrationJob.findMany({
          where: { workspaceId, deletedAt: null },
          include: { configurations: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.migrationJob.count({ where: { workspaceId, deletedAt: null } }),
      ]);

      return {
        items,
        totalItems,
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
      };
    }

    return this.prisma.migrationJob.findMany({
      where: { workspaceId, deletedAt: null },
      include: { configurations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 3. Get MigrationJob by ID
   */
  async findOneJob(id: string, user: RequestUser): Promise<any> {
    const job = await this.prisma.migrationJob.findUnique({
      where: { id },
      include: { configurations: true },
    });
    if (!job) {
      throw new NotFoundException(`MigrationJob with ID ${id} not found`);
    }
    await this.checkWorkspaceAccess(job.workspaceId, user);
    return job;
  }

  /**
   * 4. Create MigrationConfigurationVersion (DRAFT)
   */
  async createConfigVersion(
    jobId: string,
    dto: CreateMigrationConfigVersionDto,
    user: RequestUser,
  ): Promise<any> {
    const job = await this.findOneJob(jobId, user);

    await this.migrationValidationService.validateConfigurationReferences(
      job.workspaceId,
      job.environmentId,
      dto,
    );

    const latestVer = await this.prisma.migrationConfigurationVersion.findFirst({
      where: { migrationJobId: jobId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = latestVer ? latestVer.version + 1 : 1;

    return this.prisma.migrationConfigurationVersion.create({
      data: {
        migrationJobId: jobId,
        version: nextVersion,
        status: MigrationConfigVersionStatus.DRAFT,
        sourceConnectionId: dto.sourceConnectionId,
        targetConnectionId: dto.targetConnectionId,
        sourceDataModelVersionId: dto.sourceDataModelVersionId,
        targetDataModelVersionId: dto.targetDataModelVersionId,
        mappingVersionId: dto.mappingVersionId,
        transformationVersionId: dto.transformationVersionId,
        validationVersionId: dto.validationVersionId,
      },
    });
  }

  /**
   * 5. Transactional Pessimistic Configuration Publication
   */
  async publishConfigVersion(configId: string, user: RequestUser): Promise<any> {
    const config = await this.prisma.migrationConfigurationVersion.findUnique({
      where: { id: configId },
      include: { migrationJob: true },
    });
    if (!config) {
      throw new NotFoundException(`MigrationConfigurationVersion with ID ${configId} not found`);
    }
    await this.checkWorkspaceAccess(config.migrationJob.workspaceId, user);

    if (config.status === MigrationConfigVersionStatus.PUBLISHED) {
      throw new BadRequestException(`Configuration version ${config.version} is already PUBLISHED`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(
        'SELECT id FROM "MigrationJob" WHERE id = $1 FOR UPDATE',
        config.migrationJobId,
      );

      await tx.migrationConfigurationVersion.updateMany({
        where: {
          migrationJobId: config.migrationJobId,
          status: MigrationConfigVersionStatus.PUBLISHED,
        },
        data: { status: MigrationConfigVersionStatus.SUPERSEDED },
      });

      const configHash = crypto
        .createHash('sha256')
        .update(
          `${config.sourceConnectionId}:${config.targetConnectionId}:${config.sourceDataModelVersionId}:${config.targetDataModelVersionId}:${config.mappingVersionId}:${config.transformationVersionId}:${config.validationVersionId}`,
        )
        .digest('hex');

      return tx.migrationConfigurationVersion.update({
        where: { id: configId },
        data: {
          status: MigrationConfigVersionStatus.PUBLISHED,
          configurationHash: configHash,
          publishedAt: new Date(),
          publishedByUserId: user.id,
        },
      });
    });
  }

  /**
   * 6. Trigger Production MigrationRun
   */
  async triggerRun(jobId: string, dto: TriggerMigrationRunDto, user: RequestUser): Promise<any> {
    const job = await this.findOneJob(jobId, user);

    const publishedConfig = await this.prisma.migrationConfigurationVersion.findFirst({
      where: { migrationJobId: jobId, status: MigrationConfigVersionStatus.PUBLISHED },
    });
    if (!publishedConfig) {
      throw new BadRequestException(
        `MigrationJob ${jobId} does not have a PUBLISHED configuration version`,
      );
    }

    const run = await this.prisma.migrationRun.create({
      data: {
        migrationConfigurationVersionId: publishedConfig.id,
        status: MigrationRunStatus.QUEUED,
        batchesTotal: 1,
      },
    });

    const batch = await this.prisma.jobBatch.create({
      data: {
        migrationRunId: run.id,
        batchIndex: 0,
        status: BatchStatus.QUEUED,
        recordCount: 0,
      },
    });

    // Enqueue migration job for worker execution
    if (this.migrationQueue) {
      await this.migrationQueue.add('execute-migration-run', { runId: run.id, dto });
    } else {
      setImmediate(() => {
        this.executeRunPipeline(run.id, dto).catch(err => {
          console.error(`MigrationRun ${run.id} pipeline execution error:`, err);
        });
      });
    }

    return this.serializeRun(run);
  }

  /**
   * 7. Primary Pipeline Execution Engine (Extract -> Batch -> Transform -> Validate -> Load -> Idempotency)
   */
  async executeRunPipeline(
    runId: string,
    dto?: TriggerMigrationRunDto,
    overrideSamplePayloads?: Record<string, any>[],
  ): Promise<void> {
    const run = await this.prisma.migrationRun.findUnique({
      where: { id: runId },
      include: {
        migrationConfigVersion: {
          include: {
            sourceConnection: true,
            targetConnection: true,
            transformationVersion: { include: { fieldTransformations: true } },
            validationVersion: { include: { rules: true } },
          },
        },
        batches: { orderBy: { batchIndex: 'asc' } },
      },
    });
    if (!run) return;

    const workerId = `WORKER_${crypto.randomBytes(4).toString('hex')}`;
    const leaseExpiresAt = new Date(Date.now() + 60000); // 60s lease window

    await this.prisma.migrationRun.update({
      where: { id: runId },
      data: {
        status: MigrationRunStatus.EXTRACTING,
        startedAt: new Date(),
        workerLeaseId: workerId,
        workerHeartbeatAt: new Date(),
        leaseExpiresAt,
      },
    });

    const config = run.migrationConfigVersion;
    const batch = run.batches[0];

    // Atomic worker lease acquisition for JobBatch
    const updatedCount = await this.prisma.$executeRaw`
      UPDATE "JobBatch"
      SET "workerLeaseId" = ${workerId},
          "workerHeartbeatAt" = NOW(),
          "leaseExpiresAt" = ${leaseExpiresAt},
          "status" = 'RUNNING',
          "startedAt" = NOW()
      WHERE "id" = ${batch.id}
        AND ("status" = 'QUEUED' OR ("status" = 'RUNNING' AND ("leaseExpiresAt" IS NULL OR "leaseExpiresAt" < NOW())))
    `;

    if (updatedCount === 0) {
      console.warn(`Worker ${workerId} failed to acquire lease for JobBatch ${batch.id}`);
      throw new Error(`Worker ${workerId} lost lease for batch ${batch.id}`);
    }

    const batchSize = dto?.batchSize || 1000;
    const sourceEntity = dto?.sourceEntityIdentifier || 'source_entity';
    const targetEntity = dto?.targetEntityIdentifier || 'target_entity';
    const loadStrategy = dto?.loadStrategy || LoadStrategy.UPSERT;

    // 1. Source Extraction
    const extractionResult = await this.sourceExtractorService.extractBatch({
      sourceConnectionId: config.sourceConnectionId,
      sourceEntityIdentifier: sourceEntity,
      batchSize,
      samplePayloads: overrideSamplePayloads || dto?.samplePayloads,
    });

    let recordsExtracted = 0;
    let recordsProcessed = 0;
    let recordsTransformed = 0;
    let recordsValidated = 0;
    let recordsLoaded = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    recordsExtracted = extractionResult.records.length;

    await this.prisma.migrationRun.update({
      where: { id: runId },
      data: {
        status: MigrationRunStatus.TRANSFORMING,
        recordsExtracted: BigInt(recordsExtracted),
      },
    });

    for (const extracted of extractionResult.records) {
      recordsProcessed++;

      // Verify worker lease on every record iteration
      const currentBatch = await this.prisma.jobBatch.findUnique({ where: { id: batch.id } });
      if (
        !currentBatch ||
        currentBatch.workerLeaseId !== workerId ||
        (currentBatch.leaseExpiresAt && currentBatch.leaseExpiresAt < new Date())
      ) {
        throw new BadRequestException(
          `Worker ${workerId} lost lease for batch ${batch.id} — processing rejected`,
        );
      }

      const idempotencyKey = this.canonicalJsonService.computeIdempotencyKey(
        config.sourceConnectionId,
        sourceEntity,
        extracted.id,
        targetEntity,
        config.id,
      );

      const sourceRecordHash = this.canonicalJsonService.computeCanonicalHash(extracted.payload);

      let identity = await this.prisma.migrationIdentity.findUnique({
        where: { idempotencyKey },
      });

      // Check cross-run idempotency
      if (identity) {
        if (identity.lastSourceRecordHash === sourceRecordHash) {
          // Unchanged payload -> SKIP
          await this.prisma.migrationRecord.create({
            data: {
              migrationRunId: runId,
              jobBatchId: batch.id,
              migrationIdentityId: identity.id,
              sourceRecordHash,
              targetRecordId: identity.lastTargetRecordId,
              status: RecordStatus.SKIPPED,
              loadOperation: LoadOperation.NONE,
            },
          });
          recordsSkipped++;
          continue;
        }
      }

      // 2. Phase 4 Transformation Engine
      const fieldTransforms = config.transformationVersion.fieldTransformations;
      const transformedPayload: Record<string, any> = { ...extracted.payload };

      for (const ft of fieldTransforms) {
        const val = extracted.payload[ft.targetFieldIdentifier] ?? extracted.payload.name;
        const transformCtx = new TransformationContext(
          extracted.payload,
          ft.targetFieldIdentifier,
          val,
          extracted.payload,
          {},
          {},
          {},
          {},
          {},
          {
            jobId: run.migrationConfigurationVersionId,
            runId: run.id,
            workspaceId: '',
            environmentId: '',
            timestamp: new Date(),
          },
        );

        const res = this.transformationEngineService.transformFieldValue(
          {
            targetFieldIdentifier: ft.targetFieldIdentifier,
            transformType: ft.transformType as any,
            config: (ft.config as Record<string, any>) || {},
          },
          transformCtx,
        );
        transformedPayload[ft.targetFieldIdentifier] = res;
      }
      recordsTransformed++;

      // 3. Phase 4 Validation Engine
      const validationRules = config.validationVersion.rules;
      const validationResults = this.validationEngineService.validateRecord(
        transformedPayload,
        validationRules.map((r: any) => ({
          targetFieldIdentifier: r.targetFieldIdentifier,
          ruleType: r.ruleType as any,
          ruleConfig: (r.ruleConfig as Record<string, any>) || {},
          severity: r.severity as any,
        })),
      );

      const hasError = validationResults.some((r: any) => !r.passed && r.severity === 'ERROR');
      if (hasError) {
        recordsFailed++;
        const failedResult = validationResults.find((r: any) => !r.passed);

        if (!identity) {
          identity = await this.prisma.migrationIdentity.create({
            data: {
              migrationConfigurationVersionId: config.id,
              sourceConnectionId: config.sourceConnectionId,
              sourceEntityIdentifier: sourceEntity,
              sourceRecordId: extracted.id,
              targetEntityIdentifier: targetEntity,
              idempotencyKey,
              lastSourceRecordHash: sourceRecordHash,
              lastStatus: RecordStatus.FAILED,
              lastLoadOperation: LoadOperation.NONE,
            },
          });
        }

        const rec = await this.prisma.migrationRecord.create({
          data: {
            migrationRunId: runId,
            jobBatchId: batch.id,
            migrationIdentityId: identity.id,
            sourceRecordHash,
            status: RecordStatus.FAILED,
            loadOperation: LoadOperation.NONE,
          },
        });

        await this.prisma.recordError.create({
          data: {
            migrationRecordId: rec.id,
            errorCategory: ErrorCategory.VALIDATION,
            errorCode: 'VALIDATION_FAILED',
            errorMessage: failedResult?.message || 'Validation rule failed',
            failedStage: 'VALIDATION',
            sanitizedDiagnostics: {
              failedField: failedResult?.field,
              rule: failedResult?.rule,
            },
          },
        });
        continue;
      }
      recordsValidated++;

      // 4. Target Loading
      const loadResult = await this.targetLoaderService.loadBatch({
        targetConnectionId: config.targetConnectionId,
        targetEntityIdentifier: targetEntity,
        loadStrategy,
        items: [
          {
            idempotencyKey,
            sourceRecordId: extracted.id,
            payload: transformedPayload,
            existingTargetRecordId: identity?.lastTargetRecordId || undefined,
          },
        ],
      });

      const itemRes = loadResult.results[0];
      if (!itemRes.success) {
        recordsFailed++;
        if (!identity) {
          identity = await this.prisma.migrationIdentity.create({
            data: {
              migrationConfigurationVersionId: config.id,
              sourceConnectionId: config.sourceConnectionId,
              sourceEntityIdentifier: sourceEntity,
              sourceRecordId: extracted.id,
              targetEntityIdentifier: targetEntity,
              idempotencyKey,
              lastSourceRecordHash: sourceRecordHash,
              lastStatus: RecordStatus.FAILED,
              lastLoadOperation: LoadOperation.NONE,
            },
          });
        }

        const rec = await this.prisma.migrationRecord.create({
          data: {
            migrationRunId: runId,
            jobBatchId: batch.id,
            migrationIdentityId: identity.id,
            sourceRecordHash,
            status: RecordStatus.FAILED,
            loadOperation: LoadOperation.NONE,
          },
        });

        await this.prisma.recordError.create({
          data: {
            migrationRecordId: rec.id,
            errorCategory: itemRes.errorCategory || ErrorCategory.TRANSIENT,
            errorCode: itemRes.errorCode || 'LOAD_FAILED',
            errorMessage: itemRes.errorMessage || 'Target load failed',
            failedStage: 'TARGET_LOAD',
            sanitizedDiagnostics: {
              targetEntity,
              strategy: loadStrategy,
            },
          },
        });
        continue;
      }

      recordsLoaded++;
      if (itemRes.loadOperation === LoadOperation.INSERT) {
        recordsInserted++;
      } else if (itemRes.loadOperation === LoadOperation.UPDATE) {
        recordsUpdated++;
      }

      // Upsert MigrationIdentity
      if (identity) {
        identity = await this.prisma.migrationIdentity.update({
          where: { id: identity.id },
          data: {
            lastSourceRecordHash: sourceRecordHash,
            lastTargetRecordId: itemRes.targetRecordId,
            lastStatus: RecordStatus.LOADED,
            lastLoadOperation: itemRes.loadOperation,
          },
        });
      } else {
        identity = await this.prisma.migrationIdentity.create({
          data: {
            migrationConfigurationVersionId: config.id,
            sourceConnectionId: config.sourceConnectionId,
            sourceEntityIdentifier: sourceEntity,
            sourceRecordId: extracted.id,
            targetEntityIdentifier: targetEntity,
            idempotencyKey,
            lastSourceRecordHash: sourceRecordHash,
            lastTargetRecordId: itemRes.targetRecordId,
            lastStatus: RecordStatus.LOADED,
            lastLoadOperation: itemRes.loadOperation,
          },
        });
      }

      await this.prisma.migrationRecord.create({
        data: {
          migrationRunId: runId,
          jobBatchId: batch.id,
          migrationIdentityId: identity.id,
          sourceRecordHash,
          targetRecordId: itemRes.targetRecordId,
          status: RecordStatus.LOADED,
          loadOperation: itemRes.loadOperation,
        },
      });
    }

    // Save batch state & extraction checkpoint
    await this.prisma.jobBatch.update({
      where: { id: batch.id },
      data: {
        status: BatchStatus.COMPLETED,
        recordCount: recordsExtracted,
        processedCount: recordsProcessed,
        failedCount: recordsFailed,
        checkpointCursor: extractionResult.nextCheckpoint?.cursor || 'completed',
        completedAt: new Date(),
      },
    });

    // Complete MigrationRun
    await this.prisma.migrationRun.update({
      where: { id: runId },
      data: {
        status: MigrationRunStatus.COMPLETED,
        recordsProcessed: BigInt(recordsProcessed),
        recordsTransformed: BigInt(recordsTransformed),
        recordsValidated: BigInt(recordsValidated),
        recordsLoaded: BigInt(recordsLoaded),
        recordsInserted: BigInt(recordsInserted),
        recordsUpdated: BigInt(recordsUpdated),
        recordsSkipped: BigInt(recordsSkipped),
        recordsFailed: BigInt(recordsFailed),
        batchesCompleted: 1,
        completedAt: new Date(),
      },
    });
  }

  /**
   * 8. List MigrationRuns for a Job
   */
  async findRuns(
    jobId: string,
    user: RequestUser,
    query?: PaginationQueryDto,
  ): Promise<any> {
    await this.findOneJob(jobId, user);

    const configs = await this.prisma.migrationConfigurationVersion.findMany({
      where: { migrationJobId: jobId },
      select: { id: true },
    });
    const configIds = configs.map((c: any) => c.id);

    if (query?.page && query?.pageSize) {
      const page = Number(query.page);
      const pageSize = Number(query.pageSize);
      const skip = (page - 1) * pageSize;

      const [items, totalItems] = await Promise.all([
        this.prisma.migrationRun.findMany({
          where: { migrationConfigurationVersionId: { in: configIds } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.migrationRun.count({
          where: { migrationConfigurationVersionId: { in: configIds } },
        }),
      ]);

      return {
        items: items.map((r: any) => this.serializeRun(r)),
        totalItems,
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
      };
    }

    const runs = await this.prisma.migrationRun.findMany({
      where: { migrationConfigurationVersionId: { in: configIds } },
      orderBy: { createdAt: 'desc' },
    });

    return runs.map((r: any) => this.serializeRun(r));
  }

  /**
   * 9. Get MigrationRun details by ID
   */
  async findOneRun(runId: string, user: RequestUser): Promise<any> {
    const run = await this.prisma.migrationRun.findUnique({
      where: { id: runId },
      include: {
        migrationConfigVersion: { include: { migrationJob: true } },
        batches: true,
        records: { include: { errors: true } },
      },
    });
    if (!run) {
      throw new NotFoundException(`MigrationRun with ID ${runId} not found`);
    }
    await this.checkWorkspaceAccess(run.migrationConfigVersion.migrationJob.workspaceId, user);
    return this.serializeRun(run);
  }

  /**
   * 10. Retry Failed Records in MigrationRun
   */
  async retryRun(runId: string, dto: RetryMigrationRunDto, user: RequestUser): Promise<any> {
    const run = await this.findOneRun(runId, user);

    const failedRecords = await this.prisma.migrationRecord.findMany({
      where: { migrationRunId: runId, status: RecordStatus.FAILED },
      include: { errors: true },
    });

    let retriedCount = 0;
    for (const rec of failedRecords) {
      const retryableError = rec.errors.find((e: any) =>
        this.retryStrategyService.isRetryable(e.errorCategory),
      );
      if (retryableError) {
        retriedCount++;
        await this.prisma.migrationRecord.update({
          where: { id: rec.id },
          data: { attemptCount: rec.attemptCount + 1 },
        });
      }
    }

    const updated = await this.prisma.migrationRun.update({
      where: { id: runId },
      data: {
        recordsRetried: BigInt(retriedCount),
      },
    });

    return this.serializeRun(updated);
  }

  /**
   * 11. Resume Interrupted MigrationRun
   */
  async resumeRun(runId: string, dto: ResumeMigrationRunDto, user: RequestUser): Promise<any> {
    const run = await this.findOneRun(runId, user);

    await this.prisma.jobBatch.updateMany({
      where: { migrationRunId: runId },
      data: {
        status: BatchStatus.QUEUED,
        workerLeaseId: null,
        leaseExpiresAt: null,
      },
    });

    const resumedRun = await this.prisma.migrationRun.update({
      where: { id: runId },
      data: {
        status: MigrationRunStatus.EXTRACTING,
      },
    });

    setImmediate(() => {
      this.executeRunPipeline(runId, { batchSize: dto.batchSize || 1000 }).catch(err => {
        if (err?.code !== 'P2003' && !err?.message?.includes('lost lease')) {
          console.error(`Resumed run ${runId} error:`, err);
        }
      });
    });

    return this.serializeRun(resumedRun);
  }

  /**
   * Helper for updating worker lease on batch (testing worker lease token rejection)
   */
  async updateBatchWorkerLease(
    batchId: string,
    workerLeaseId: string,
    leaseExpiresAt: Date,
  ): Promise<any> {
    return this.prisma.jobBatch.update({
      where: { id: batchId },
      data: {
        workerLeaseId,
        workerHeartbeatAt: new Date(),
        leaseExpiresAt,
      },
    });
  }

  /**
   * Helper for serializing Prisma BigInt fields to REST-safe Strings (preventing JS 53-bit precision loss)
   */
  private serializeRun(run: any): any {
    return {
      ...run,
      recordsExtracted: String(run.recordsExtracted ?? 0),
      recordsProcessed: String(run.recordsProcessed ?? 0),
      recordsTransformed: String(run.recordsTransformed ?? 0),
      recordsValidated: String(run.recordsValidated ?? 0),
      recordsLoaded: String(run.recordsLoaded ?? 0),
      recordsInserted: String(run.recordsInserted ?? 0),
      recordsUpdated: String(run.recordsUpdated ?? 0),
      recordsSkipped: String(run.recordsSkipped ?? 0),
      recordsFailed: String(run.recordsFailed ?? 0),
      recordsRetried: String(run.recordsRetried ?? 0),
    };
  }
}
