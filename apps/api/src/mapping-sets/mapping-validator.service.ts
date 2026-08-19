import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MappingValidatorService {
  constructor(private prisma: PrismaService) {}

  async validateMappingVersionForPublication(mappingVersionId: string): Promise<void> {
    const version = await this.prisma.mappingVersion.findUnique({
      where: { id: mappingVersionId },
      include: {
        mappingSet: true,
        canonicalModelVersion: {
          include: {
            canonicalModel: true,
            entities: {
              include: { fields: true },
            },
          },
        },
        dataModelVersion: {
          include: {
            dataModel: {
              include: {
                connection: {
                  include: {
                    environment: {
                      include: { workspace: true },
                    },
                  },
                },
              },
            },
            entities: {
              include: { fields: true },
            },
          },
        },
        entityMappings: {
          include: {
            fieldMappings: true,
          },
        },
      },
    });

    if (!version) {
      throw new BadRequestException(`MappingVersion ${mappingVersionId} not found`);
    }

    const { mappingSet, canonicalModelVersion, dataModelVersion, entityMappings } = version;

    // 1. Workspace Ownership & Version Compatibility Check
    const mappingWorkspaceId = mappingSet.workspaceId;
    const canonicalWorkspaceId = canonicalModelVersion.canonicalModel.workspaceId;
    const dataModelWorkspaceId = dataModelVersion.dataModel.connection.environment.workspaceId;

    if (canonicalWorkspaceId !== mappingWorkspaceId) {
      throw new BadRequestException(
        `Version Compatibility Failure: CanonicalModel belongs to workspace ${canonicalWorkspaceId}, but MappingSet belongs to workspace ${mappingWorkspaceId}`
      );
    }

    if (dataModelWorkspaceId !== mappingWorkspaceId) {
      throw new BadRequestException(
        `Version Compatibility Failure: DataModel belongs to workspace ${dataModelWorkspaceId}, but MappingSet belongs to workspace ${mappingWorkspaceId}`
      );
    }

    // 2. Validate Entity and Field Mappings
    if (!entityMappings || entityMappings.length === 0) {
      throw new BadRequestException(`MappingVersion ${mappingVersionId} contains no EntityMappings`);
    }

    for (const em of entityMappings) {
      if (mappingSet.direction === 'SOURCE_TO_CANONICAL') {
        if (!em.sourceEntityId || !em.canonicalEntityId || em.targetEntityId) {
          throw new BadRequestException(
            `Direction Constraint Violation: EntityMapping in SOURCE_TO_CANONICAL must specify sourceEntityId and canonicalEntityId only`
          );
        }

        const validSourceEntity = dataModelVersion.entities.find(e => e.id === em.sourceEntityId);
        if (!validSourceEntity) {
          throw new BadRequestException(
            `Entity Existence Failure: Source DataEntity ${em.sourceEntityId} does not belong to DataModelVersion ${dataModelVersion.id}`
          );
        }

        const validCanonicalEntity = canonicalModelVersion.entities.find(e => e.id === em.canonicalEntityId);
        if (!validCanonicalEntity) {
          throw new BadRequestException(
            `Entity Existence Failure: CanonicalEntity ${em.canonicalEntityId} does not belong to CanonicalModelVersion ${canonicalModelVersion.id}`
          );
        }

        // Validate Field Mappings
        for (const fm of em.fieldMappings) {
          if (!fm.canonicalFieldId) {
            throw new BadRequestException(`FieldMapping must specify canonicalFieldId`);
          }

          const validCanonicalField = validCanonicalEntity.fields.find(f => f.id === fm.canonicalFieldId);
          if (!validCanonicalField) {
            throw new BadRequestException(
              `Field Existence Failure: CanonicalField ${fm.canonicalFieldId} does not belong to CanonicalEntity ${validCanonicalEntity.id}`
            );
          }

          if (fm.transformType !== 'CONSTANT') {
            if (!fm.sourceFieldId) {
              throw new BadRequestException(`FieldMapping with transformType '${fm.transformType}' requires sourceFieldId`);
            }
            const validSourceField = validSourceEntity.fields.find(f => f.id === fm.sourceFieldId);
            if (!validSourceField) {
              throw new BadRequestException(
                `Field Existence Failure: Source DataField ${fm.sourceFieldId} does not belong to Source DataEntity ${validSourceEntity.id}`
              );
            }
          }
        }
      } else if (mappingSet.direction === 'CANONICAL_TO_TARGET') {
        if (!em.canonicalEntityId || !em.targetEntityId || em.sourceEntityId) {
          throw new BadRequestException(
            `Direction Constraint Violation: EntityMapping in CANONICAL_TO_TARGET must specify canonicalEntityId and targetEntityId only`
          );
        }

        const validCanonicalEntity = canonicalModelVersion.entities.find(e => e.id === em.canonicalEntityId);
        if (!validCanonicalEntity) {
          throw new BadRequestException(
            `Entity Existence Failure: CanonicalEntity ${em.canonicalEntityId} does not belong to CanonicalModelVersion ${canonicalModelVersion.id}`
          );
        }

        const validTargetEntity = dataModelVersion.entities.find(e => e.id === em.targetEntityId);
        if (!validTargetEntity) {
          throw new BadRequestException(
            `Entity Existence Failure: Target DataEntity ${em.targetEntityId} does not belong to DataModelVersion ${dataModelVersion.id}`
          );
        }

        // Validate Field Mappings
        for (const fm of em.fieldMappings) {
          if (!fm.canonicalFieldId || !fm.targetFieldId) {
            throw new BadRequestException(`FieldMapping in CANONICAL_TO_TARGET must specify canonicalFieldId and targetFieldId`);
          }

          const validCanonicalField = validCanonicalEntity.fields.find(f => f.id === fm.canonicalFieldId);
          if (!validCanonicalField) {
            throw new BadRequestException(
              `Field Existence Failure: CanonicalField ${fm.canonicalFieldId} does not belong to CanonicalEntity ${validCanonicalEntity.id}`
            );
          }

          const validTargetField = validTargetEntity.fields.find(f => f.id === fm.targetFieldId);
          if (!validTargetField) {
            throw new BadRequestException(
              `Field Existence Failure: Target DataField ${fm.targetFieldId} does not belong to Target DataEntity ${validTargetEntity.id}`
            );
          }
        }
      }
    }
  }
}
