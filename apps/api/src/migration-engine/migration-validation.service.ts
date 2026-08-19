import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MigrationValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates workspace & environment hierarchy when creating a MigrationJob
   */
  async validateJobCreation(workspaceId: string, environmentId: string): Promise<void> {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with ID ${environmentId} not found`);
    }

    if (environment.workspaceId !== workspaceId) {
      throw new BadRequestException(
        `Environment ${environmentId} does not belong to Workspace ${workspaceId}`,
      );
    }
  }

  /**
   * Validates workspace & environment hierarchy for all 7 configuration references
   */
  async validateConfigurationReferences(
    workspaceId: string,
    environmentId: string,
    refs: {
      sourceConnectionId: string;
      targetConnectionId: string;
      sourceDataModelVersionId: string;
      targetDataModelVersionId: string;
      mappingVersionId: string;
      transformationVersionId: string;
      validationVersionId: string;
    },
  ): Promise<void> {
    const [
      srcConn,
      tgtConn,
      srcDmVer,
      tgtDmVer,
      mapVer,
      transVer,
      valVer,
    ] = await Promise.all([
      this.prisma.connection.findUnique({ where: { id: refs.sourceConnectionId } }),
      this.prisma.connection.findUnique({ where: { id: refs.targetConnectionId } }),
      this.prisma.dataModelVersion.findUnique({
        where: { id: refs.sourceDataModelVersionId },
        include: { dataModel: { include: { connection: true } } },
      }),
      this.prisma.dataModelVersion.findUnique({
        where: { id: refs.targetDataModelVersionId },
        include: { dataModel: { include: { connection: true } } },
      }),
      this.prisma.mappingVersion.findUnique({
        where: { id: refs.mappingVersionId },
        include: { mappingSet: true },
      }),
      this.prisma.transformationVersion.findUnique({
        where: { id: refs.transformationVersionId },
        include: { transformationSet: true },
      }),
      this.prisma.validationVersion.findUnique({
        where: { id: refs.validationVersionId },
        include: { validationSet: true },
      }),
    ]);

    if (!srcConn || srcConn.environmentId !== environmentId) {
      throw new BadRequestException(
        `Source Connection ${refs.sourceConnectionId} must belong to Environment ${environmentId}`,
      );
    }

    if (!tgtConn || tgtConn.environmentId !== environmentId) {
      throw new BadRequestException(
        `Target Connection ${refs.targetConnectionId} must belong to Environment ${environmentId}`,
      );
    }

    if (!srcDmVer || srcDmVer.dataModel.connection.environmentId !== environmentId) {
      throw new BadRequestException(
        `Source DataModelVersion ${refs.sourceDataModelVersionId} must belong to Environment ${environmentId}`,
      );
    }

    if (!tgtDmVer || tgtDmVer.dataModel.connection.environmentId !== environmentId) {
      throw new BadRequestException(
        `Target DataModelVersion ${refs.targetDataModelVersionId} must belong to Environment ${environmentId}`,
      );
    }

    if (!mapVer || mapVer.mappingSet.workspaceId !== workspaceId) {
      throw new BadRequestException(
        `MappingVersion ${refs.mappingVersionId} must belong to Workspace ${workspaceId}`,
      );
    }

    if (!transVer || transVer.transformationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(
        `TransformationVersion ${refs.transformationVersionId} must belong to Workspace ${workspaceId}`,
      );
    }

    if (!valVer || valVer.validationSet.workspaceId !== workspaceId) {
      throw new BadRequestException(
        `ValidationVersion ${refs.validationVersionId} must belong to Workspace ${workspaceId}`,
      );
    }
  }
}
