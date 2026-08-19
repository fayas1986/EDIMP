import { Injectable, BadRequestException } from '@nestjs/common';
import { TransformationContext } from '@edimp/contracts';

export type CustomTransformFn = (context: TransformationContext, args: any[]) => any;

@Injectable()
export class TransformRegistryService {
  private registry = new Map<string, CustomTransformFn>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register('UPPERCASE', (ctx) => String(ctx.value ?? '').toUpperCase());
    this.register('LOWERCASE', (ctx) => String(ctx.value ?? '').toLowerCase());
    this.register('TRIM', (ctx) => String(ctx.value ?? '').trim());
    this.register('DATE_FORMAT', (ctx, [formatStr]) => {
      if (!ctx.value) return null;
      const date = new Date(ctx.value);
      if (isNaN(date.getTime())) return String(ctx.value);
      if (formatStr === 'YYYY-MM-DD') return date.toISOString().split('T')[0];
      if (formatStr === 'ISO') return date.toISOString();
      return date.toISOString();
    });
    this.register('CAST', (ctx, [targetType]) => {
      const val = ctx.value;
      if (val === null || val === undefined) return null;
      const type = String(targetType).toUpperCase();
      switch (type) {
        case 'STRING':
          return String(val);
        case 'INTEGER':
        case 'INT':
          const parsedInt = parseInt(val, 10);
          return isNaN(parsedInt) ? null : parsedInt;
        case 'FLOAT':
        case 'NUMBER':
          const parsedFloat = parseFloat(val);
          return isNaN(parsedFloat) ? null : parsedFloat;
        case 'BOOLEAN':
        case 'BOOL':
          return String(val).toLowerCase() === 'true' || val === 1 || val === true;
        case 'DATETIME':
          return new Date(val).toISOString();
        default:
          return val;
      }
    });
  }

  register(name: string, fn: CustomTransformFn) {
    this.registry.set(name.toUpperCase(), fn);
  }

  get(name: string): CustomTransformFn {
    const fn = this.registry.get(name.toUpperCase());
    if (!fn) {
      throw new BadRequestException(
        `Unregistered custom transform function: '${name}'. Allowed functions: ${Array.from(this.registry.keys()).join(', ')}`
      );
    }
    return fn;
  }
}
