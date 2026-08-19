import { Injectable, BadRequestException } from '@nestjs/common';
import { ValidationResult } from '@edimp/contracts';

export interface FieldValidationRuleSpec {
  targetFieldIdentifier: string;
  ruleType: 'NOT_NULL' | 'REGEX' | 'RANGE' | 'TYPE_CHECK' | 'ENUM_MATCH';
  ruleConfig: Record<string, any>;
  severity?: 'ERROR' | 'WARNING';
}

@Injectable()
export class ValidationEngineService {
  validateFieldValue(spec: FieldValidationRuleSpec, record: Record<string, any>): ValidationResult {
    const { targetFieldIdentifier, ruleType, ruleConfig, severity = 'ERROR' } = spec;
    const value = record[targetFieldIdentifier];

    let passed = true;
    let message = `Field '${targetFieldIdentifier}' passed ${ruleType} validation`;

    switch (ruleType) {
      case 'NOT_NULL':
        passed = value !== null && value !== undefined && value !== '';
        if (!passed) {
          message = `Field '${targetFieldIdentifier}' cannot be null or empty`;
        }
        break;

      case 'REGEX':
        const patternStr = ruleConfig.pattern || ruleConfig.regex;
        if (!patternStr) {
          throw new BadRequestException(`REGEX validation rule requires a 'pattern' string in ruleConfig`);
        }
        if (value === null || value === undefined) {
          passed = ruleConfig.allowNull ?? false;
        } else {
          try {
            const regex = new RegExp(patternStr);
            passed = regex.test(String(value));
          } catch (e: any) {
            throw new BadRequestException(`Invalid regular expression pattern: '${patternStr}'`);
          }
        }
        if (!passed) {
          message = `Field '${targetFieldIdentifier}' value '${value}' does not match pattern '${patternStr}'`;
        }
        break;

      case 'RANGE':
        if (value === null || value === undefined) {
          passed = ruleConfig.allowNull ?? false;
        } else {
          const num = Number(value);
          if (isNaN(num)) {
            passed = false;
          } else {
            const min = ruleConfig.min !== undefined ? Number(ruleConfig.min) : -Infinity;
            const max = ruleConfig.max !== undefined ? Number(ruleConfig.max) : Infinity;
            passed = num >= min && num <= max;
          }
        }
        if (!passed) {
          message = `Field '${targetFieldIdentifier}' value '${value}' is outside range [${ruleConfig.min ?? '-∞'}, ${ruleConfig.max ?? '∞'}]`;
        }
        break;

      case 'TYPE_CHECK':
        const expectedType = String(ruleConfig.expectedType || ruleConfig.dataType || 'STRING').toUpperCase();
        if (value === null || value === undefined) {
          passed = ruleConfig.allowNull ?? true;
        } else {
          switch (expectedType) {
            case 'STRING':
              passed = typeof value === 'string';
              break;
            case 'NUMBER':
            case 'FLOAT':
              passed = typeof value === 'number' && !isNaN(value);
              break;
            case 'INTEGER':
            case 'INT':
              passed = typeof value === 'number' && Number.isInteger(value);
              break;
            case 'BOOLEAN':
            case 'BOOL':
              passed = typeof value === 'boolean';
              break;
            case 'OBJECT':
              passed = typeof value === 'object' && value !== null && !Array.isArray(value);
              break;
            case 'ARRAY':
              passed = Array.isArray(value);
              break;
            default:
              passed = true;
          }
        }
        if (!passed) {
          message = `Field '${targetFieldIdentifier}' value '${value}' is not of expected type '${expectedType}'`;
        }
        break;

      case 'ENUM_MATCH':
        const allowedValues = Array.isArray(ruleConfig.allowedValues)
          ? ruleConfig.allowedValues
          : Array.isArray(ruleConfig.values)
          ? ruleConfig.values
          : [];
        if (value === null || value === undefined) {
          passed = ruleConfig.allowNull ?? false;
        } else {
          passed = allowedValues.includes(value);
        }
        if (!passed) {
          message = `Field '${targetFieldIdentifier}' value '${value}' is not one of allowed values: [${allowedValues.join(', ')}]`;
        }
        break;

      default:
        throw new BadRequestException(`Unsupported validation rule type: '${ruleType}'`);
    }

    return {
      field: targetFieldIdentifier,
      rule: ruleType,
      severity,
      passed,
      actualValue: value,
      message,
      metadata: ruleConfig,
    };
  }

  validateRecord(record: Record<string, any>, rules: FieldValidationRuleSpec[]): ValidationResult[] {
    return rules.map((spec) => this.validateFieldValue(spec, record));
  }
}
