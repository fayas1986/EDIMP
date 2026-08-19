import { Injectable, BadRequestException } from '@nestjs/common';
import { TransformationContext } from '@edimp/contracts';

interface ASTNode {
  type: 'LITERAL' | 'FIELD_REF' | 'FUNCTION_CALL';
  value?: any;
  name?: string;
  args?: ASTNode[];
}

@Injectable()
export class SafeExpressionEngineService {
  private readonly MAX_EXPRESSION_LENGTH = 1000;
  private readonly MAX_AST_DEPTH = 10;
  private readonly MAX_EVAL_OPS = 1000;
  private readonly MAX_ARGS = 10;
  private readonly MAX_OUTPUT_SIZE = 10000;

  private readonly ALLOWED_FUNCTIONS = new Set([
    'CONCAT',
    'SUBSTR',
    'COALESCE',
    'UPPER',
    'LOWER',
    'ROUND',
    'TRIM',
  ]);

  evaluate(expression: string, context: TransformationContext): any {
    if (!expression || typeof expression !== 'string') {
      return null;
    }

    if (expression.length > this.MAX_EXPRESSION_LENGTH) {
      throw new BadRequestException(
        `Expression length ${expression.length} exceeds maximum allowed limit of ${this.MAX_EXPRESSION_LENGTH} characters`
      );
    }

    const tokens = this.tokenize(expression);
    const ast = this.parse(tokens);

    let opCounter = { count: 0 };
    const result = this.evaluateAst(ast, context, 0, opCounter);

    if (typeof result === 'string' && result.length > this.MAX_OUTPUT_SIZE) {
      throw new BadRequestException(
        `Expression result output size exceeds limit of ${this.MAX_OUTPUT_SIZE} characters`
      );
    }

    return result;
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '(' || char === ')' || char === ',') {
        tokens.push(char);
        i++;
        continue;
      }

      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        i++;
        while (i < expr.length && expr[i] !== quote) {
          str += expr[i];
          i++;
        }
        i++; // skip closing quote
        tokens.push(JSON.stringify(str));
        continue;
      }

      // Identifier or Number
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_\.]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }

      if (ident.length > 0) {
        tokens.push(ident);
      } else {
        i++;
      }
    }

    return tokens;
  }

  private parse(tokens: string[]): ASTNode {
    let index = 0;

    const parseNext = (depth: number): ASTNode => {
      if (depth > this.MAX_AST_DEPTH) {
        throw new BadRequestException(`Expression AST depth exceeds maximum allowed limit of ${this.MAX_AST_DEPTH}`);
      }

      if (index >= tokens.length) {
        throw new BadRequestException('Unexpected end of expression tokens');
      }

      const token = tokens[index++];

      // String literal
      if (token.startsWith('"') && token.endsWith('"')) {
        return { type: 'LITERAL', value: JSON.parse(token) };
      }

      // Number literal
      if (!isNaN(Number(token))) {
        return { type: 'LITERAL', value: Number(token) };
      }

      // Function call
      if (index < tokens.length && tokens[index] === '(') {
        const funcName = token.toUpperCase();
        if (!this.ALLOWED_FUNCTIONS.has(funcName)) {
          throw new BadRequestException(
            `Forbidden function '${funcName}' in expression. Allowed functions: ${Array.from(this.ALLOWED_FUNCTIONS).join(', ')}`
          );
        }

        index++; // skip '('
        const args: ASTNode[] = [];

        if (tokens[index] !== ')') {
          while (index < tokens.length) {
            if (args.length >= this.MAX_ARGS) {
              throw new BadRequestException(`Function call '${funcName}' exceeds maximum allowed arguments (${this.MAX_ARGS})`);
            }
            args.push(parseNext(depth + 1));
            if (tokens[index] === ',') {
              index++; // skip ','
            } else if (tokens[index] === ')') {
              break;
            } else {
              throw new BadRequestException(`Expected ',' or ')' in function arguments near token '${tokens[index]}'`);
            }
          }
        }

        if (tokens[index] === ')') {
          index++; // skip ')'
        } else {
          throw new BadRequestException(`Expected closing ')' for function '${funcName}'`);
        }

        return { type: 'FUNCTION_CALL', name: funcName, args };
      }

      // Field Reference
      return { type: 'FIELD_REF', name: token };
    };

    const root = parseNext(0);
    return root;
  }

  private evaluateAst(node: ASTNode, ctx: TransformationContext, depth: number, opCounter: { count: number }): any {
    opCounter.count++;
    if (opCounter.count > this.MAX_EVAL_OPS) {
      throw new BadRequestException(`Expression evaluation exceeded safety limit of ${this.MAX_EVAL_OPS} operations`);
    }

    if (depth > this.MAX_AST_DEPTH) {
      throw new BadRequestException(`Expression evaluation exceeded AST depth limit of ${this.MAX_AST_DEPTH}`);
    }

    switch (node.type) {
      case 'LITERAL':
        return node.value;

      case 'FIELD_REF':
        return node.name ? ctx.record[node.name] ?? ctx.sourceRecord[node.name] ?? null : null;

      case 'FUNCTION_CALL':
        const evalArgs = (node.args || []).map((arg) => this.evaluateAst(arg, ctx, depth + 1, opCounter));
        return this.executeBuiltin(node.name || '', evalArgs);

      default:
        throw new BadRequestException(`Unknown AST node type: ${(node as any).type}`);
    }
  }

  private executeBuiltin(name: string, args: any[]): any {
    switch (name.toUpperCase()) {
      case 'CONCAT':
        return args.map((a) => (a === null || a === undefined ? '' : String(a))).join('');
      case 'SUBSTR':
        const str = String(args[0] ?? '');
        const start = Number(args[1] ?? 0);
        const length = args[2] !== undefined ? Number(args[2]) : undefined;
        return str.substring(start, length !== undefined ? start + length : undefined);
      case 'COALESCE':
        for (const arg of args) {
          if (arg !== null && arg !== undefined && arg !== '') return arg;
        }
        return null;
      case 'UPPER':
        return String(args[0] ?? '').toUpperCase();
      case 'LOWER':
        return String(args[0] ?? '').toLowerCase();
      case 'TRIM':
        return String(args[0] ?? '').trim();
      case 'ROUND':
        const num = Number(args[0] ?? 0);
        const decimals = Number(args[1] ?? 0);
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
      default:
        throw new BadRequestException(`Unsupported built-in function: '${name}'`);
    }
  }
}
