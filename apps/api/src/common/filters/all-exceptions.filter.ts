import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@edimp/database';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected internal error occurred';
    let details: any[] = [];

    // Extract traceId from response headers (set by TraceInterceptor) or request headers
    const traceId =
      (response.getHeader && (response.getHeader('x-trace-id') as string)) ||
      (request.headers['x-trace-id'] as string) ||
      (request.headers['traceparent'] ? (request.headers['traceparent'] as string).split('-')[1] : undefined);

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resPayload = exception.getResponse();

      if (typeof resPayload === 'string') {
        message = resPayload;
        error = this.getHttpStatusName(statusCode);
      } else if (typeof resPayload === 'object' && resPayload !== null) {
        const obj = resPayload as any;
        message = obj.message || exception.message;
        error = obj.error || this.getHttpStatusName(statusCode);
        details = Array.isArray(obj.details) ? obj.details : obj.message && Array.isArray(obj.message) ? obj.message : [];
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'Unique constraint violation: resource already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Requested record was not found';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Database Error';
        message = `Database constraint error (${exception.code})`;
      }
    } else if (exception instanceof Error) {
      // In production mode, sanitize internal stack traces and SQL details
      const nodeEnv = process.env.NODE_ENV || 'development';
      message = nodeEnv === 'production' ? 'An unexpected server error occurred' : exception.message;
      error = exception.name || 'Internal Error';
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${statusCode} - Error: ${error} - Message: ${message} - TraceId: ${traceId || 'N/A'}`
    );

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      details: details.length > 0 ? details : undefined,
      traceId: traceId || undefined,
    });
  }

  private getHttpStatusName(status: number): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Unprocessable Entity';
      case 429: return 'Too Many Requests';
      case 503: return 'Service Unavailable';
      default: return 'Internal Server Error';
    }
  }
}
