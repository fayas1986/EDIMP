import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from '@edimp/contracts';
import { AuditAction } from '@edimp/database';

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram';
  allowedLabels: string[];
  values: Map<string, number>;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  // Strictly allowed low-cardinality label whitelist
  private static readonly ALLOWED_PROMETHEUS_LABELS = new Set([
    'method',
    'route',
    'status',
    'connector_type',
    'operation',
    'worker_pool',
    'queue_name',
    'reason',
  ]);

  // Forbidden high-cardinality label blacklist
  private static readonly FORBIDDEN_HIGH_CARDINALITY_LABELS = new Set([
    'tenantid',
    'workspaceid',
    'userid',
    'workerid',
    'hostname',
    'traceid',
    'migrationrunid',
    'recordid',
    'connectionid',
    'user_id',
    'tenant_id',
    'workspace_id',
    'trace_id',
  ]);

  private readonly metrics: Map<string, MetricDefinition> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.initMetrics();
  }

  private initMetrics() {
    this.registerMetric('edimp_http_requests_total', 'Total HTTP requests', 'counter', ['method', 'route', 'status']);
    this.registerMetric('edimp_http_request_duration_seconds', 'HTTP request duration histogram in seconds', 'histogram', ['method', 'route', 'status']);
    
    // Queue & Worker Metrics
    this.registerMetric('edimp_queue_depth', 'Current queue depth', 'gauge', ['queue_name']);
    this.registerMetric('edimp_jobs_queued_total', 'Total jobs queued', 'counter', ['queue_name']);
    this.registerMetric('edimp_jobs_completed_total', 'Total jobs completed successfully', 'counter', ['queue_name']);
    this.registerMetric('edimp_jobs_failed_total', 'Total jobs failed', 'counter', ['queue_name']);
    this.registerMetric('edimp_processing_duration_seconds', 'Operation processing duration in seconds', 'histogram', ['operation']);
    this.registerMetric('edimp_active_workers', 'Active worker count', 'gauge', ['worker_pool']);
    this.registerMetric('edimp_worker_heartbeat_age_seconds', 'Worker heartbeat age in seconds (low-cardinality by pool)', 'gauge', ['worker_pool']);
    this.registerMetric('edimp_dlq_items', 'Total Dead-Letter Queue items parked', 'gauge', ['reason']);

    // Connector Observability
    this.registerMetric('edimp_connector_operations_total', 'Total operations by connector type', 'counter', ['connector_type', 'operation', 'status']);
    this.registerMetric('edimp_connector_operation_duration_seconds', 'Connector operation duration in seconds', 'histogram', ['connector_type', 'operation']);

    // Rate Limit Throttling
    this.registerMetric('edimp_rate_limit_throttled_total', 'Total requests throttled by rate limit', 'counter', ['route', 'reason']);
  }

  private registerMetric(name: string, help: string, type: 'counter' | 'gauge' | 'histogram', allowedLabels: string[]) {
    this.metrics.set(name, {
      name,
      help,
      type,
      allowedLabels,
      values: new Map(),
    });
  }

  /**
   * Safely sanitize and enforce low-cardinality labels before incrementing
   */
  incrementCounter(metricName: string, rawLabels: Record<string, string> = {}, value: number = 1) {
    const metric = this.metrics.get(metricName);
    if (!metric) return;

    const safeLabels = this.filterLowCardinalityLabels(rawLabels, metric.allowedLabels);
    const labelKey = this.formatLabelKey(safeLabels);
    const current = metric.values.get(labelKey) || 0;
    metric.values.set(labelKey, current + value);
  }

  /**
   * Set Gauge metric
   */
  setGauge(metricName: string, value: number, rawLabels: Record<string, string> = {}) {
    const metric = this.metrics.get(metricName);
    if (!metric) return;

    const safeLabels = this.filterLowCardinalityLabels(rawLabels, metric.allowedLabels);
    const labelKey = this.formatLabelKey(safeLabels);
    metric.values.set(labelKey, value);
  }

  /**
   * Record HTTP request performance
   */
  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
    const labels = { method, route: route || 'unknown', status: statusCode.toString() };
    this.incrementCounter('edimp_http_requests_total', labels);
    const durationSec = Number((durationMs / 1000).toFixed(4));
    this.incrementCounter('edimp_http_request_duration_seconds', labels, durationSec);
  }

  /**
   * Format Prometheus text-based exposition output
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [, metric] of this.metrics.entries()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      if (metric.values.size === 0) {
        lines.push(`${metric.name} 0`);
      } else {
        for (const [labelStr, val] of metric.values.entries()) {
          const labelFormatted = labelStr ? `{${labelStr}}` : '';
          lines.push(`${metric.name}${labelFormatted} ${val}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Sanitized Append-Only Audit Trail Persistence
   */
  async recordAuditLog(params: {
    tenantId?: string;
    workspaceId?: string;
    environmentId?: string;
    userId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    traceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }) {
    try {
      const sanitizedDetails = this.sanitizeAuditDetails(params.details || {});

      return await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          workspaceId: params.workspaceId,
          environmentId: params.environmentId,
          userId: params.userId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          traceId: params.traceId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          details: sanitizedDetails,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record append-only audit log: ${err.message}`, err.stack);
    }
  }

  /**
   * Read-Only Workspace Audit Logs Querying (Append-Only Enforced)
   */
  async listAuditLogs(workspaceId: string, query: AuditLogQueryDto) {
    const where: any = { workspaceId };
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.traceId) where.traceId = query.traceId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 20,
      skip: query.offset || 0,
    });
  }

  /**
   * Filters out any high-cardinality labels, guaranteeing compliance
   */
  private filterLowCardinalityLabels(
    inputLabels: Record<string, string>,
    metricAllowed: string[],
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, val] of Object.entries(inputLabels)) {
      const lowerKey = key.toLowerCase();
      if (
        ObservabilityService.FORBIDDEN_HIGH_CARDINALITY_LABELS.has(lowerKey) ||
        !ObservabilityService.ALLOWED_PROMETHEUS_LABELS.has(lowerKey) ||
        !metricAllowed.includes(lowerKey)
      ) {
        continue; // Exclude forbidden or unapproved high-cardinality labels
      }
      result[lowerKey] = val;
    }

    return result;
  }

  private formatLabelKey(labels: Record<string, string>): string {
    const keys = Object.keys(labels).sort();
    if (keys.length === 0) return '';
    return keys.map(k => `${k}="${labels[k]}"`).join(',');
  }

  /**
   * Deeply redacts passwords, tokens, secrets, PII, and sensitive keys
   */
  private sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
    if (!details || typeof details !== 'object') return {};

    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
      'authorization',
      'cookie',
      'creditcard',
      'ssn',
    ];

    const sanitizeVal = (val: any): any => {
      if (val === null || val === undefined) return val;
      if (Array.isArray(val)) return val.map(sanitizeVal);
      if (typeof val === 'object') {
        const copy: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          const lowerK = k.toLowerCase();
          if (sensitivePatterns.some(p => lowerK.includes(p))) {
            copy[k] = '[REDACTED_SENSITIVE_DATA]';
          } else {
            copy[k] = sanitizeVal(v);
          }
        }
        return copy;
      }
      return val;
    };

    return sanitizeVal(details);
  }
}
