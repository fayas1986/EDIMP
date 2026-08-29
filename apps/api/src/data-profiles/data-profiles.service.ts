import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/auth/auth.guard';
import { DataProfilesWorker } from './data-profiles.worker';
import { CreateDataProfileRunDto, AsyncOperationResponse, DataProfileRunResponse } from '@edimp/contracts';

@Injectable()
export class DataProfilesService {
  constructor(
    private prisma: PrismaService,
    private worker: DataProfilesWorker,
  ) {}

  private async verifyVersionAccess(versionId: string, userId: string) {
    const version = await this.prisma.dataModelVersion.findUnique({
      where: { id: versionId },
      include: {
        dataModel: {
          include: {
            connection: {
              include: {
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
            },
          },
        },
      },
    });

    if (!version || version.dataModel.deletedAt || version.dataModel.connection.deletedAt || version.dataModel.connection.environment.deletedAt) {
      throw new NotFoundException(`DataModelVersion ${versionId} not found`);
    }

    const tenant = version.dataModel.connection.environment.workspace.tenant;
    const workspace = version.dataModel.connection.environment.workspace;

    const hasTenantAccess = tenant.members.length > 0;
    const hasWorkspaceAccess = workspace.members.length > 0;

    if (!hasTenantAccess && !hasWorkspaceAccess) {
      throw new ForbiddenException(`User does not have access to DataModelVersion ${versionId}`);
    }

    return version;
  }

  // Explicit Consistency Check Method (callable by service & unit/integration tests)
  async verifyMetricConsistency(dataProfileRunId: string, dataEntityId?: string, dataFieldId?: string) {
    const run = await this.prisma.dataProfileRun.findUnique({
      where: { id: dataProfileRunId },
      include: {
        dataModelVersion: {
          include: {
            entities: {
              include: { fields: true },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`DataProfileRun ${dataProfileRunId} not found`);
    }

    if (dataEntityId) {
      const validEntity = run.dataModelVersion.entities.find(e => e.id === dataEntityId);
      if (!validEntity) {
        throw new BadRequestException(
          `Consistency Violation: DataEntity ${dataEntityId} does not belong to DataModelVersion ${run.dataModelVersionId}`
        );
      }

      if (dataFieldId) {
        const validField = validEntity.fields.find(f => f.id === dataFieldId);
        if (!validField) {
          throw new BadRequestException(
            `Consistency Violation: DataField ${dataFieldId} does not belong to DataEntity ${dataEntityId}`
          );
        }
      }
    }

    return true;
  }

  async createRun(dto: CreateDataProfileRunDto, user: RequestUser): Promise<AsyncOperationResponse> {
    await this.verifyVersionAccess(dto.dataModelVersionId, user.id);

    // Create run in QUEUED state with null startedAt
    const run = await this.prisma.dataProfileRun.create({
      data: {
        dataModelVersionId: dto.dataModelVersionId,
        status: 'QUEUED',
        queuedAt: new Date(),
        startedAt: null,
      },
    });

    // Enqueue async profiling task in background worker
    this.worker.enqueueProfileRun(run.id);

    return {
      id: run.id,
      status: 'QUEUED',
    };
  }

  async getRun(id: string, user: RequestUser): Promise<DataProfileRunResponse> {
    const run = await this.prisma.dataProfileRun.findUnique({
      where: { id },
      include: {
        metrics: true,
      },
    });

    if (!run) {
      throw new NotFoundException(`DataProfileRun ${id} not found`);
    }

    await this.verifyVersionAccess(run.dataModelVersionId, user.id);

    return run;
  }
}
