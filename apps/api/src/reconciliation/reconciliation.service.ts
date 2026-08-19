import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReconciliationJobDto,
  CreateReconciliationConfigVersionDto,
  TriggerReconciliationRunDto,
} from '@edimp/contracts';
import {
  ReconciliationConfigVersionStatus,
  ReconciliationRunStatus,
  DiscrepancyType,
  DiscrepancyStatus,
  ObservationState,
  ReconciliationMode,
} from '@edimp/database';
import * as crypto from 'crypto';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enforce tenant -> workspace -> environment hierarchy
   */
  async validateHierarchy(workspaceId: string, environmentId: string) {
    const env = await this.prisma.environment.findFirst({
      where: { id: environmentId, workspaceId, deletedAt: null },
    });
    if (!env) {
      throw new ForbiddenException('Access denied: Environment does not belong to specified Workspace');
    }
  }

  async createJob(workspaceId: string, userId: string, dto: CreateReconciliationJobDto) {
    await this.validateHierarchy(workspaceId, dto.environmentId);

    return this.prisma.reconciliationJob.create({
      data: {
        workspaceId,
        environmentId: dto.environmentId,
        name: dto.name,
        description: dto.description,
        status: 'ACTIVE',
      },
    });
  }

  async createConfigurationVersion(jobId: string, userId: string, dto: CreateReconciliationConfigVersionDto) {
    const job = await this.prisma.reconciliationJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Reconciliation job not found');

    const lastVersion = await this.prisma.reconciliationConfigurationVersion.findFirst({
      where: { reconciliationJobId: jobId },
      orderBy: { version: 'desc' },
    });
    const versionNumber = (lastVersion?.version ?? 0) + 1;

    return this.prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: jobId,
        version: versionNumber,
        status: ReconciliationConfigVersionStatus.DRAFT,
        sourceConnectionId: dto.sourceConnectionId,
        targetConnectionId: dto.targetConnectionId,
        sourceDataModelVersionId: dto.sourceDataModelVersionId,
        targetDataModelVersionId: dto.targetDataModelVersionId,
        sourceEntityIdentifier: dto.sourceEntityIdentifier ?? 'default_source_entity',
        targetEntityIdentifier: dto.targetEntityIdentifier ?? 'default_target_entity',
        identityMapping: dto.identityMapping ?? {},
        comparisonFields: dto.comparisonFields ?? [],
        aggregateFields: dto.aggregateFields ?? [],
        mode: (dto.mode as ReconciliationMode) ?? ReconciliationMode.FULL,
        samplingConfig: dto.samplingConfig ?? {},
        watermarkConfig: dto.watermarkConfig ?? {},
      },
    });
  }

  async publishConfigurationVersion(jobId: string, versionId: string, userId: string) {
    const version = await this.prisma.reconciliationConfigurationVersion.findFirst({
      where: { id: versionId, reconciliationJobId: jobId },
    });
    if (!version) throw new NotFoundException('Configuration version not found');
    if (version.status === ReconciliationConfigVersionStatus.PUBLISHED) {
      return version;
    }

    // Freeze configuration by hashing configuration content
    const recipeObj = {
      jobId,
      version: version.version,
      sourceConnectionId: version.sourceConnectionId,
      targetConnectionId: version.targetConnectionId,
      sourceDataModelVersionId: version.sourceDataModelVersionId,
      targetDataModelVersionId: version.targetDataModelVersionId,
      identityMapping: version.identityMapping,
      comparisonFields: version.comparisonFields,
      aggregateFields: version.aggregateFields,
      mode: version.mode,
      samplingConfig: version.samplingConfig,
      watermarkConfig: version.watermarkConfig,
    };
    const configHash = crypto.createHash('sha256').update(JSON.stringify(recipeObj)).digest('hex');

    // Supersede older published versions
    await this.prisma.reconciliationConfigurationVersion.updateMany({
      where: { reconciliationJobId: jobId, status: ReconciliationConfigVersionStatus.PUBLISHED },
      data: { status: ReconciliationConfigVersionStatus.SUPERSEDED },
    });

    return this.prisma.reconciliationConfigurationVersion.update({
      where: { id: versionId },
      data: {
        status: ReconciliationConfigVersionStatus.PUBLISHED,
        configurationHash: configHash,
        publishedAt: new Date(),
        publishedByUserId: userId,
      },
    });
  }

  async triggerRun(jobId: string, configVersionId: string, userId: string, dto: TriggerReconciliationRunDto) {
    const configVer = await this.prisma.reconciliationConfigurationVersion.findFirst({
      where: { id: configVersionId, reconciliationJobId: jobId },
    });
    if (!configVer) throw new NotFoundException('Configuration version not found');
    if (configVer.status !== ReconciliationConfigVersionStatus.PUBLISHED) {
      throw new BadRequestException('Can only execute published configuration versions');
    }

    const run = await this.prisma.reconciliationRun.create({
      data: {
        reconciliationConfigurationVersionId: configVersionId,
        migrationRunId: dto.migrationRunId ?? null,
        status: ReconciliationRunStatus.QUEUED,
        batchesTotal: 1,
      },
    });

    // Spawn async execution
    setImmediate(() => {
      this.executeRunPipeline(run.id, dto.sampleSourceRecords, dto.sampleTargetRecords).catch(() => {});
    });

    return {
      ...run,
      totalRecordsCompared: Number(run.totalRecordsCompared),
      discrepanciesFound: Number(run.discrepanciesFound),
      missingCount: Number(run.missingCount),
      orphanCount: Number(run.orphanCount),
      attributeMismatchCount: Number(run.attributeMismatchCount),
      aggregateMismatchCount: Number(run.aggregateMismatchCount),
    };
  }

  async executeRunPipeline(
    runId: string,
    sampleSourceRecords?: Record<string, any>[],
    sampleTargetRecords?: Record<string, any>[]
  ) {
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: { reconConfigVersion: true },
    });
    if (!run) return;

    // Acquire worker lease
    const workerLeaseId = `worker-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + 60000); // 60s lease

    await this.prisma.reconciliationRun.update({
      where: { id: runId },
      data: {
        status: ReconciliationRunStatus.RUNNING,
        workerLeaseId,
        workerHeartbeatAt: now,
        leaseExpiresAt,
        startedAt: now,
      },
    });

    const config = run.reconConfigVersion;
    const identityMapping = (config.identityMapping as Record<string, string>) || {};
    const comparisonFields = (config.comparisonFields as Record<string, any>[]) || [];
    const aggregateFields = (config.aggregateFields as Record<string, any>[]) || [];
    const mode = config.mode;
    const samplingConfig = (config.samplingConfig as Record<string, any>) || {};

    const sourceRecords = sampleSourceRecords || [];
    const targetRecords = sampleTargetRecords || [];

    // Filter records if SAMPLED or INCREMENTAL mode
    let filteredSource = sourceRecords;
    let filteredTarget = targetRecords;

    if (mode === ReconciliationMode.SAMPLED && samplingConfig.sampleRate) {
      const sampleRate = Number(samplingConfig.sampleRate); // e.g. 0.5 (50%)
      const seed = samplingConfig.seed || 'seed123';
      filteredSource = sourceRecords.filter((r) => {
        const key = String(r.id || r.legacy_customer_no || JSON.stringify(r));
        const hashVal = crypto.createHash('md5').update(seed + key).digest('hex');
        const num = parseInt(hashVal.substring(0, 4), 16) / 65535;
        return num <= sampleRate;
      });
    } else if (mode === ReconciliationMode.INCREMENTAL && config.watermarkConfig) {
      const watermarkField = (config.watermarkConfig as any).field || 'updatedAt';
      const watermarkValue = (config.watermarkConfig as any).since;
      if (watermarkValue) {
        const sinceTime = new Date(watermarkValue).getTime();
        filteredSource = sourceRecords.filter((r) => new Date(r[watermarkField] || 0).getTime() >= sinceTime);
        filteredTarget = targetRecords.filter((r) => new Date(r[watermarkField] || 0).getTime() >= sinceTime);
      }
    }

    // Build Target Lookup Map using Identity Mapping
    // e.g. identityMapping: { legacy_customer_no: 'bc_customer_code' }
    const sourceIdKey = Object.keys(identityMapping)[0] || 'id';
    const targetIdKey = identityMapping[sourceIdKey] || sourceIdKey;

    const targetMap = new Map<string, Record<string, any>>();
    for (const tr of filteredTarget) {
      const tid = String(tr[targetIdKey] ?? tr.id ?? '');
      if (tid) targetMap.set(tid, tr);
    }

    let missingCount = 0;
    let orphanCount = 0;
    let attributeMismatchCount = 0;
    let aggregateMismatchCount = 0;
    let totalCompared = 0;

    const matchedTargetIds = new Set<string>();

    for (const sr of filteredSource) {
      totalCompared++;
      const sid = String(sr[sourceIdKey] ?? sr.id ?? '');
      const tr = targetMap.get(sid);

      if (!tr) {
        // MISSING_IN_TARGET
        missingCount++;
        await this.recordDiscrepancy(
          config.id,
          run.id,
          sid,
          null,
          null,
          DiscrepancyType.MISSING_IN_TARGET,
          { sourcePayload: sr }
        );
      } else {
        matchedTargetIds.add(sid);
        // Compare fields
        for (const cf of comparisonFields) {
          const sFieldName = cf.sourceField || cf.field;
          const tFieldName = cf.targetField || sFieldName;
          const rules = cf.rules || {};

          let sVal = sr[sFieldName];
          let tVal = tr[tFieldName];

          // Apply normalization rules
          sVal = this.normalizeValue(sVal, rules);
          tVal = this.normalizeValue(tVal, rules);

          if (sVal !== tVal) {
            attributeMismatchCount++;
            // IMPORTANT: Pass fieldIdentifier so SHA-256 key is field-specific
            await this.recordDiscrepancy(
              config.id,
              run.id,
              sid,
              String(tr[targetIdKey] ?? tr.id ?? ''),
              sFieldName,
              DiscrepancyType.ATTRIBUTE_MISMATCH,
              { field: sFieldName, sourceValue: sVal, targetValue: tVal }
            );
          }
        }
      }
    }

    // Identify ORPHAN_IN_TARGET (records in target not present in source)
    for (const tr of filteredTarget) {
      const tid = String(tr[targetIdKey] ?? tr.id ?? '');
      if (tid && !matchedTargetIds.has(tid)) {
        orphanCount++;
        await this.recordDiscrepancy(
          config.id,
          run.id,
          null,
          tid,
          null,
          DiscrepancyType.ORPHAN_IN_TARGET,
          { targetPayload: tr }
        );
      }
    }

    // Exact Financial Decimal Aggregate Comparison
    for (const af of aggregateFields) {
      const fieldName = af.field;
      let sSum = 0;
      let tSum = 0;
      for (const sr of filteredSource) sSum += Number(sr[fieldName] || 0);
      for (const tr of filteredTarget) tSum += Number(tr[fieldName] || 0);

      // Exact fixed-point string comparison with precision cutoff (2 decimal places)
      const sSumStr = sSum.toFixed(2);
      const tSumStr = tSum.toFixed(2);

      if (sSumStr !== tSumStr) {
        aggregateMismatchCount++;
        await this.recordDiscrepancy(
          config.id,
          run.id,
          null,
          null,
          fieldName,
          DiscrepancyType.AGGREGATE_SUM_MISMATCH,
          { field: fieldName, sourceSum: sSumStr, targetSum: tSumStr }
        );
      }
    }

    const discrepanciesFound = missingCount + orphanCount + attributeMismatchCount + aggregateMismatchCount;

    // Create Checkpoint Batch
    await this.prisma.reconciliationBatch.create({
      data: {
        reconciliationRunId: run.id,
        batchIndex: 0,
        status: 'COMPLETED',
        recordCount: totalCompared,
        checkpointCursor: `cursor-end-${totalCompared}`,
        startedAt: now,
        completedAt: new Date(),
      },
    });

    // Complete run
    await this.prisma.reconciliationRun.update({
      where: { id: run.id },
      data: {
        status: ReconciliationRunStatus.COMPLETED,
        totalRecordsCompared: BigInt(totalCompared),
        discrepanciesFound: BigInt(discrepanciesFound),
        missingCount: BigInt(missingCount),
        orphanCount: BigInt(orphanCount),
        attributeMismatchCount: BigInt(attributeMismatchCount),
        aggregateMismatchCount: BigInt(aggregateMismatchCount),
        batchesCompleted: 1,
        completedAt: new Date(),
      },
    });
  }

  private normalizeValue(val: any, rules: Record<string, any>): any {
    if (val === null || val === undefined) {
      return rules.treatNullAsEmpty ? '' : null;
    }
    let res = val;
    if (typeof res === 'string') {
      if (rules.trimWhitespace) res = res.trim();
      if (rules.ignoreCase) res = res.toLowerCase();
      if (rules.dateFormatNorm) {
        const d = new Date(res);
        if (!isNaN(d.getTime())) res = d.toISOString();
      }
    } else if (typeof res === 'number') {
      if (rules.decimalPlaces !== undefined) {
        res = Number(res.toFixed(rules.decimalPlaces));
      }
    }
    return res;
  }

  private async recordDiscrepancy(
    configVersionId: string,
    runId: string,
    sourceRecordId: string | null,
    targetRecordId: string | null,
    fieldIdentifier: string | null,
    discrepancyType: DiscrepancyType,
    payloadDiff: Record<string, any>
  ) {
    // SHA256(configVersionId + sourceRecordId + targetRecordId + discrepancyType + (fieldIdentifier || ''))
    const identityRaw = `${configVersionId}:${sourceRecordId || ''}:${targetRecordId || ''}:${discrepancyType}:${fieldIdentifier || ''}`;
    const discrepancyIdentityKey = crypto.createHash('sha256').update(identityRaw).digest('hex');

    const existing = await this.prisma.reconciliationDiscrepancy.findUnique({
      where: { discrepancyIdentityKey },
    });

    let discrepancyId: string;
    let state: ObservationState = ObservationState.NEW;

    if (existing) {
      discrepancyId = existing.id;
      state = ObservationState.PERSISTED;
    } else {
      const created = await this.prisma.reconciliationDiscrepancy.create({
        data: {
          reconciliationConfigurationVersionId: configVersionId,
          discrepancyIdentityKey,
          sourceRecordId,
          targetRecordId,
          fieldIdentifier,
          discrepancyType,
          status: DiscrepancyStatus.OPEN,
        },
      });
      discrepancyId = created.id;
    }

    // Append observation timeline entry
    await this.prisma.reconciliationObservation.create({
      data: {
        reconciliationDiscrepancyId: discrepancyId,
        reconciliationRunId: runId,
        state,
        payloadDiff,
      },
    });
  }

  async getRunDetails(runId: string) {
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        reconConfigVersion: true,
        batches: true,
        observations: {
          include: { discrepancy: true },
        },
      },
    });
    if (!run) throw new NotFoundException('Reconciliation run not found');

    return {
      ...run,
      totalRecordsCompared: String(run.totalRecordsCompared ?? 0),
      discrepanciesFound: String(run.discrepanciesFound ?? 0),
      missingCount: String(run.missingCount ?? 0),
      orphanCount: String(run.orphanCount ?? 0),
      attributeMismatchCount: String(run.attributeMismatchCount ?? 0),
      aggregateMismatchCount: String(run.aggregateMismatchCount ?? 0),
    };
  }
}
