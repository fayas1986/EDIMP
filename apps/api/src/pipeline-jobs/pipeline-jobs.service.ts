import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { CreatePipelineJobDto, PreviewTransformDto, PaginationQueryDto, PaginatedResult, PipelineJobResponse, PipelineExecutionRunResponse, AsyncOperationResponse, PreviewTransformResponse } from '@edimp/contracts';
import { TransformationEngineService } from '../transformations/transformation-engine.service';
import { ValidationEngineService } from '../validations/validation-engine.service';
import { PipelineQueueService } from './pipeline-queue.service';

@Injectable()
export class PipelineJobsService {
  constructor(
    private prisma: PrismaService,
    private transformationEngine: TransformationEngineService,
    private validationEngine: ValidationEngineService,
    private pipelineQueue: PipelineQueueService,
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

  // Serializes BigInt counters in execution runs for JSON responses (string conversion prevents precision loss)
  private serializeRun(run: any) {
    return {
      ...run,
      recordsProcessed: String(run.recordsProcessed ?? 0),
      recordsTransformed: String(run.recordsTransformed ?? 0),
      recordsValidated: String(run.recordsValidated ?? 0),
      recordsValidationFailed: String(run.recordsValidationFailed ?? 0),
      recordsTransformationFailed: String(run.recordsTransformationFailed ?? 0),
    };
  }

  async create(workspaceId: string, dto: CreatePipelineJobDto, user: RequestUser): Promise<PipelineJobResponse> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    // 1. Verify Environment belongs to Workspace
    const env = await this.prisma.environment.findFirst({
      where: { id: dto.environmentId, workspaceId, deletedAt: null },
    });
    if (!env) {
      throw new BadRequestException(`Environment ${dto.environmentId} not found in Workspace ${workspaceId}`);
    }

    // 2. Verify MappingVersion (must be PUBLISHED and belong to same Workspace)
    const mappingVersion = await this.prisma.mappingVersion.findFirst({
      where: { id: dto.mappingVersionId },
      include: { mappingSet: true },
    });
    if (!mappingVersion || mappingVersion.mappingSet.workspaceId !== workspaceId) {
      throw new BadRequestException(`MappingVersion ${dto.mappingVersionId} not found in Workspace ${workspaceId}`);
    }
    if (mappingVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(`MappingVersion ${dto.mappingVersionId} is not PUBLISHED (status: '${mappingVersion.status}')`);
    }

    // 3. Verify TransformationVersion (must be PUBLISHED and belong to same Workspace)
    const transformationVersion = await this.prisma.transformationVersion.findFirst({
      where: { id: dto.transformationVersionId },
      include: { transformationSet: true },
    });
    if (!transformationVersion || transformationVersion.transformationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(`TransformationVersion ${dto.transformationVersionId} not found in Workspace ${workspaceId}`);
    }
    if (transformationVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(`TransformationVersion ${dto.transformationVersionId} is not PUBLISHED (status: '${transformationVersion.status}')`);
    }

    // 4. Verify ValidationVersion (must be PUBLISHED and belong to same Workspace)
    const validationVersion = await this.prisma.validationVersion.findFirst({
      where: { id: dto.validationVersionId },
      include: { validationSet: true },
    });
    if (!validationVersion || validationVersion.validationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(`ValidationVersion ${dto.validationVersionId} not found in Workspace ${workspaceId}`);
    }
    if (validationVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(`ValidationVersion ${dto.validationVersionId} is not PUBLISHED (status: '${validationVersion.status}')`);
    }

    // Check unique name per workspace
    const existing = await this.prisma.pipelineJob.findFirst({
      where: { workspaceId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`PipelineJob with name '${dto.name}' already exists in this workspace`);
    }

    const job = await this.prisma.pipelineJob.create({
      data: {
        workspaceId,
        environmentId: dto.environmentId,
        mappingVersionId: dto.mappingVersionId,
        transformationVersionId: dto.transformationVersionId,
        validationVersionId: dto.validationVersionId,
        name: dto.name,
        description: dto.description,
      },
      include: {
        environment: true,
        mappingVersion: true,
        transformationVersion: true,
        validationVersion: true,
      },
    });

    return job as any as PipelineJobResponse;
  }

  async preview(workspaceId: string, dto: PreviewTransformDto, user: RequestUser): Promise<PreviewTransformResponse> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    // Preview accepts DRAFT or PUBLISHED versions
    const transformationVersion = await this.prisma.transformationVersion.findFirst({
      where: { id: dto.transformationVersionId },
      include: {
        transformationSet: true,
        fieldTransformations: true,
      },
    });
    if (!transformationVersion || transformationVersion.transformationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(`TransformationVersion ${dto.transformationVersionId} not found in Workspace ${workspaceId}`);
    }

    const validationVersion = await this.prisma.validationVersion.findFirst({
      where: { id: dto.validationVersionId },
      include: {
        validationSet: true,
        rules: true,
      },
    });
    if (!validationVersion || validationVersion.validationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(`ValidationVersion ${dto.validationVersionId} not found in Workspace ${workspaceId}`);
    }

    const fieldTransformations = transformationVersion.fieldTransformations.map((t) => ({
      targetFieldIdentifier: t.targetFieldIdentifier,
      transformType: t.transformType as any,
      config: (t.config as any) || {},
    }));

    const validationRules = validationVersion.rules.map((r) => ({
      targetFieldIdentifier: r.targetFieldIdentifier,
      ruleType: r.ruleType as any,
      ruleConfig: (r.ruleConfig as any) || {},
      severity: r.severity as any,
    }));

    const transformedRecords: Record<string, any>[] = [];
    const allValidationResults: any[] = [];

    const executionMetadata = {
      jobId: 'preview',
      workspaceId,
      environmentId: 'preview',
      timestamp: new Date(),
    };

    for (const record of dto.sampleRecords || []) {
      const { transformedRecord } = this.transformationEngine.transformRecord(
        record,
        fieldTransformations,
        executionMetadata,
        dto.lookupTables || {}
      );
      transformedRecords.push(transformedRecord);

      const validationResults = this.validationEngine.validateRecord(transformedRecord, validationRules);
      allValidationResults.push(...validationResults);
    }

    return {
      transformedRecords,
      validationResults: allValidationResults,
    };
  }

  async executeRun(jobId: string, user: RequestUser, payloadInput?: { records?: any[]; lookupTables?: any }): Promise<AsyncOperationResponse> {
    const job = await this.prisma.pipelineJob.findFirst({
      where: { id: jobId, deletedAt: null },
      include: {
        mappingVersion: true,
        transformationVersion: true,
        validationVersion: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`PipelineJob ${jobId} not found`);
    }

    await this.verifyWorkspaceAccess(job.workspaceId, user.id);

    // Production execution accepts ONLY PUBLISHED versions
    if (job.mappingVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Production execution rejects DRAFT or SUPERSEDED versions. MappingVersion ${job.mappingVersionId} is '${job.mappingVersion.status}'.`
      );
    }
    if (job.transformationVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Production execution rejects DRAFT or SUPERSEDED versions. TransformationVersion ${job.transformationVersionId} is '${job.transformationVersion.status}'.`
      );
    }
    if (job.validationVersion.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Production execution rejects DRAFT or SUPERSEDED versions. ValidationVersion ${job.validationVersionId} is '${job.validationVersion.status}'.`
      );
    }

    // Create execution run recording exact immutable version IDs and definition hashes
    const run = await this.prisma.pipelineExecutionRun.create({
      data: {
        pipelineJobId: jobId,
        mappingVersionId: job.mappingVersionId,
        transformationVersionId: job.transformationVersionId,
        validationVersionId: job.validationVersionId,
        mappingDefinitionHash: job.mappingVersion.definitionHash,
        transformationDefinitionHash: job.transformationVersion.definitionHash,
        validationDefinitionHash: job.validationVersion.definitionHash,
        status: 'QUEUED',
      },
    });

    // Enqueue async execution task
    this.pipelineQueue.enqueueRun({
      runId: run.id,
      jobId,
      records: payloadInput?.records || [],
      lookupTables: payloadInput?.lookupTables || {},
    });

    return {
      id: run.id,
      status: 'QUEUED',
    };
  }

  async findAll(workspaceId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<PipelineJobResponse>> {
    await this.verifyWorkspaceAccess(workspaceId, user.id);

    const where = { workspaceId, deletedAt: null };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [jobs, totalItems] = await Promise.all([
      this.prisma.pipelineJob.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          environment: true,
          mappingVersion: true,
          transformationVersion: true,
          validationVersion: true,
        },
      }),
      this.prisma.pipelineJob.count({ where }),
    ]);

    return {
      data: jobs as any as PipelineJobResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }

  async findOne(id: string, user: RequestUser): Promise<PipelineJobResponse> {
    const job = await this.prisma.pipelineJob.findFirst({
      where: { id, deletedAt: null },
      include: {
        environment: true,
        mappingVersion: true,
        transformationVersion: true,
        validationVersion: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`PipelineJob ${id} not found`);
    }

    await this.verifyWorkspaceAccess(job.workspaceId, user.id);

    return job as any as PipelineJobResponse;
  }

  async findRuns(jobId: string, user: RequestUser, query?: PaginationQueryDto): Promise<PaginatedResult<PipelineExecutionRunResponse>> {
    const job = await this.findOne(jobId, user);

    const where = { pipelineJobId: jobId };

    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;

    const [runs, totalItems] = await Promise.all([
      this.prisma.pipelineExecutionRun.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pipelineExecutionRun.count({ where }),
    ]);

    return {
      data: runs.map((r) => this.serializeRun(r)) as any as PipelineExecutionRunResponse[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    };
  }
}
