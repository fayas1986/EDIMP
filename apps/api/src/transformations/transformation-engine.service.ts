import { Injectable, BadRequestException } from '@nestjs/common';
import { TransformRegistryService } from './transform-registry.service';
import { SafeExpressionEngineService } from './safe-expression-engine.service';
import { TransformationContext } from '@edimp/contracts';

export interface FieldTransformSpec {
  targetFieldIdentifier: string;
  transformType: 'DIRECT' | 'CONSTANT' | 'LOOKUP' | 'CONDITIONAL' | 'EXPRESSION' | 'CUSTOM_TRANSFORM';
  config: Record<string, any>;
}

@Injectable()
export class TransformationEngineService {
  constructor(
    private readonly transformRegistry: TransformRegistryService,
    private readonly expressionEngine: SafeExpressionEngineService,
  ) {}

  transformFieldValue(spec: FieldTransformSpec, context: TransformationContext): any {
    const { transformType, config } = spec;

    switch (transformType) {
      case 'DIRECT':
        return context.value ?? (config.sourceField ? context.record[config.sourceField] : null);

      case 'CONSTANT':
        return config.value ?? config.defaultValue ?? null;

      case 'LOOKUP':
        const lookupTableKey = config.lookupTableName || config.tableName;
        const lookupKey = String(context.value ?? context.record[config.sourceField] ?? '');
        if (lookupTableKey && context.lookupTables[lookupTableKey]) {
          const map = context.lookupTables[lookupTableKey];
          return map[lookupKey] ?? config.defaultValue ?? null;
        }
        if (config.mapping && typeof config.mapping === 'object') {
          return config.mapping[lookupKey] ?? config.defaultValue ?? null;
        }
        return config.defaultValue ?? null;

      case 'CONDITIONAL':
        const conditionField = config.conditionField || config.field;
        const conditionOp = (config.operator || 'EQUALS').toUpperCase();
        const conditionVal = config.value;
        const fieldValue = context.record[conditionField] ?? context.value;

        let isMatch = false;
        switch (conditionOp) {
          case 'EQUALS':
          case 'EQ':
            isMatch = fieldValue == conditionVal;
            break;
          case 'NOT_EQUALS':
          case 'NEQ':
            isMatch = fieldValue != conditionVal;
            break;
          case 'GREATER_THAN':
          case 'GT':
            isMatch = Number(fieldValue) > Number(conditionVal);
            break;
          case 'LESS_THAN':
          case 'LT':
            isMatch = Number(fieldValue) < Number(conditionVal);
            break;
          case 'IS_NULL':
            isMatch = fieldValue === null || fieldValue === undefined;
            break;
          case 'NOT_NULL':
            isMatch = fieldValue !== null && fieldValue !== undefined;
            break;
          default:
            isMatch = fieldValue == conditionVal;
        }

        return isMatch ? config.thenValue : (config.elseValue ?? null);

      case 'EXPRESSION':
        const expr = config.expression || config.formula;
        if (!expr || typeof expr !== 'string') {
          throw new BadRequestException(`EXPRESSION transform requires a valid 'expression' string in config`);
        }
        return this.expressionEngine.evaluate(expr, context);

      case 'CUSTOM_TRANSFORM':
        const functionName = config.functionName || config.fn;
        if (!functionName || typeof functionName !== 'string') {
          throw new BadRequestException(`CUSTOM_TRANSFORM requires a valid 'functionName' string in config`);
        }
        const fn = this.transformRegistry.get(functionName);
        const fnArgs = Array.isArray(config.args) ? config.args : [];
        return fn(context, fnArgs);

      default:
        throw new BadRequestException(`Unsupported transform type: '${transformType}'`);
    }
  }

  transformRecord(
    record: Record<string, any>,
    transformations: FieldTransformSpec[],
    executionMetadata: any,
    lookupTables: Record<string, Record<string, any>> = {}
  ): { transformedRecord: Record<string, any>; errors: string[] } {
    const transformedRecord: Record<string, any> = { ...record };
    const errors: string[] = [];

    for (const spec of transformations) {
      try {
        const initialValue = record[spec.targetFieldIdentifier] ?? record[spec.config?.sourceField] ?? null;

        const context = new TransformationContext(
          record,
          spec.targetFieldIdentifier,
          initialValue,
          record, // sourceRecord
          record, // canonicalRecord
          transformedRecord, // targetRecord
          {}, // sourceSchemaContext
          {}, // targetSchemaContext
          lookupTables,
          executionMetadata
        );

        const newValue = this.transformFieldValue(spec, context);
        transformedRecord[spec.targetFieldIdentifier] = newValue;
      } catch (err: any) {
        errors.push(`Error transforming field '${spec.targetFieldIdentifier}': ${err.message}`);
      }
    }

    return { transformedRecord, errors };
  }
}
