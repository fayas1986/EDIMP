import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ObservabilityService } from './observability.service';
import * as crypto from 'crypto';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) {
      return next.handle();
    }

    // Extract OpenTelemetry W3C traceparent header: 00-{traceId}-{spanId}-{flags}
    const incomingTraceparent = req.headers['traceparent'] || req.headers['x-trace-id'];
    let traceId: string;
    let spanId: string = crypto.randomBytes(8).toString('hex');
    let parentSpanId: string | undefined;

    if (incomingTraceparent && typeof incomingTraceparent === 'string') {
      const parts = incomingTraceparent.split('-');
      if (parts.length >= 4) {
        traceId = parts[1];
        parentSpanId = parts[2];
      } else {
        traceId = incomingTraceparent;
      }
    } else {
      traceId = crypto.randomBytes(16).toString('hex');
    }

    // Construct valid OpenTelemetry W3C traceparent context string
    const otelTraceparent = `00-${traceId}-${spanId}-01`;

    // Attach OpenTelemetry trace context to request
    req.traceId = traceId;
    req.spanId = spanId;
    req.parentSpanId = parentSpanId;
    req.traceparent = otelTraceparent;

    // Convenience response header
    if (res && res.setHeader) {
      res.setHeader('x-trace-id', traceId);
      res.setHeader('traceparent', otelTraceparent);
    }

    const startTime = Date.now();
    const method = req.method;
    const url = req.route ? req.route.path : req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res ? res.statusCode : 200;
          this.observabilityService.recordHttpRequest(method, url, statusCode, duration);
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const statusCode = err?.status || err?.statusCode || 500;
          this.observabilityService.recordHttpRequest(method, url, statusCode, duration);
        },
      }),
    );
  }
}
