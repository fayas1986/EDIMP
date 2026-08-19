import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class StructuredLoggerService implements LoggerService {
  log(message: any, context?: string) {
    this.outputLog('INFO', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.outputLog('ERROR', message, context, { trace });
  }

  warn(message: any, context?: string) {
    this.outputLog('WARN', message, context);
  }

  debug(message: any, context?: string) {
    this.outputLog('DEBUG', message, context);
  }

  verbose(message: any, context?: string) {
    this.outputLog('VERBOSE', message, context);
  }

  private outputLog(level: string, message: any, context?: string, extra: Record<string, any> = {}) {
    const timestamp = new Date().toISOString();
    const logObj: Record<string, any> = {
      timestamp,
      level,
      context: context || 'Application',
      message: typeof message === 'object' ? JSON.stringify(this.sanitize(message)) : message,
      ...extra,
    };

    console.log(JSON.stringify(logObj));
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = Array.isArray(obj) ? [...obj] : { ...obj };

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie'];
    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object') {
        copy[key] = this.sanitize(copy[key]);
      }
    }
    return copy;
  }
}
