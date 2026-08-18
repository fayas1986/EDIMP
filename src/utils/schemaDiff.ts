import { SchemaVersion, SchemaVersionDiff, SchemaFieldDefinition } from '../types';

export function computeSchemaVersionDiff(
  baseVer: SchemaVersion,
  targetVer: SchemaVersion
): SchemaVersionDiff {
  const baseMap = new Map<string, SchemaFieldDefinition>();
  baseVer.fields.forEach((f) => baseMap.set(f.fieldName, f));

  const targetMap = new Map<string, SchemaFieldDefinition>();
  targetVer.fields.forEach((f) => targetMap.set(f.fieldName, f));

  const addedFields: SchemaFieldDefinition[] = [];
  const removedFields: SchemaFieldDefinition[] = [];
  const modifiedFields: {
    fieldName: string;
    changes: string[];
    oldType?: string;
    newType?: string;
    oldNullable?: boolean;
    newNullable?: boolean;
  }[] = [];
  const breakingChanges: string[] = [];

  // Find added and modified fields
  targetVer.fields.forEach((targetField) => {
    const baseField = baseMap.get(targetField.fieldName);
    if (!baseField) {
      addedFields.push(targetField);
      if (!targetField.isNullable && targetField.defaultValue === undefined) {
        breakingChanges.push(`Added REQUIRED field '${targetField.fieldName}' without a default value.`);
      }
    } else {
      // Check for modifications
      const changes: string[] = [];
      let oldType: string | undefined;
      let newType: string | undefined;
      let oldNullable: boolean | undefined;
      let newNullable: boolean | undefined;

      if (baseField.dataType !== targetField.dataType) {
        changes.push(`Data Type changed: ${baseField.dataType} → ${targetField.dataType}`);
        oldType = baseField.dataType;
        newType = targetField.dataType;
        // Potential breaking change check
        if (baseField.dataType.includes('VARCHAR') && targetField.dataType.includes('VARCHAR')) {
          const oldLen = parseInt(baseField.dataType.replace(/[^0-9]/g, '')) || 0;
          const newLen = parseInt(targetField.dataType.replace(/[^0-9]/g, '')) || 0;
          if (newLen < oldLen) {
            breakingChanges.push(`Narrowed length for field '${targetField.fieldName}' from ${baseField.dataType} to ${targetField.dataType} (Potential truncation risk).`);
          }
        }
      }

      if (baseField.isNullable !== targetField.isNullable) {
        changes.push(`Nullability changed: ${baseField.isNullable ? 'NULLABLE' : 'NOT NULL'} → ${targetField.isNullable ? 'NULLABLE' : 'NOT NULL'}`);
        oldNullable = baseField.isNullable;
        newNullable = targetField.isNullable;
        if (baseField.isNullable && !targetField.isNullable) {
          breakingChanges.push(`Field '${targetField.fieldName}' changed from NULLABLE to NOT NULL (Required field constraint break).`);
        }
      }

      if (baseField.isPrimaryKey !== targetField.isPrimaryKey) {
        changes.push(`Primary Key status changed.`);
        breakingChanges.push(`Primary Key constraint changed on field '${targetField.fieldName}'.`);
      }

      if (changes.length > 0) {
        modifiedFields.push({
          fieldName: targetField.fieldName,
          changes,
          oldType,
          newType,
          oldNullable,
          newNullable,
        });
      }
    }
  });

  // Find removed fields
  baseVer.fields.forEach((baseField) => {
    if (!targetMap.has(baseField.fieldName)) {
      removedFields.push(baseField);
      breakingChanges.push(`Field '${baseField.fieldName}' was REMOVED from schema in ${targetVer.versionId}.`);
    }
  });

  return {
    baseVersion: baseVer.versionId,
    targetVersion: targetVer.versionId,
    addedFields,
    removedFields,
    modifiedFields,
    breakingChanges,
  };
}
