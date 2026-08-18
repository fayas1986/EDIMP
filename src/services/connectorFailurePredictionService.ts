import {
  Connector,
  ConnectorFailurePrediction,
  ConnectorLatencyHistoricalPoint,
  LatencyForecastPoint,
  SpikeRootCause,
  ProactiveMitigationAction,
} from '../types';

/**
 * Baseline latency lookup by provider/category for realistic enterprise simulation.
 */
const CONNECTOR_BASELINES: Record<string, { baselineMs: number; failureThresholdMs: number; providerType: string }> = {
  'conn-sap-s4': { baselineMs: 22, failureThresholdMs: 380, providerType: 'SAP OData v4 Enterprise Gateway' },
  'conn-salesforce-crm': { baselineMs: 38, failureThresholdMs: 420, providerType: 'Salesforce REST v58.0 API' },
  'conn-oracle-fusion': { baselineMs: 35, failureThresholdMs: 400, providerType: 'Oracle Cloud Fusion FSCM Engine' },
  'conn-workday-hcm': { baselineMs: 42, failureThresholdMs: 450, providerType: 'Workday Enterprise Custom Report API' },
  'conn-snowflake-dw': { baselineMs: 14, failureThresholdMs: 250, providerType: 'Snowflake Cloud Data Warehouse' },
  'conn-netsuite-erp': { baselineMs: 52, failureThresholdMs: 500, providerType: 'NetSuite SuiteTalk RESTlet Gateway' },
  'conn-aws-s3-lake': { baselineMs: 19, failureThresholdMs: 300, providerType: 'AWS S3 High-Throughput REST Object Store' },
  'conn-hubspot-crm': { baselineMs: 28, failureThresholdMs: 350, providerType: 'HubSpot CRM v3 REST API' },
  'conn-sql-server': { baselineMs: 16, failureThresholdMs: 280, providerType: 'Microsoft SQL Server TDS Protocol' },
  'conn-dynamics-365': { baselineMs: 34, failureThresholdMs: 410, providerType: 'Dynamics 365 Business Central API' },
};

/**
 * Generates 24-hour historical latency trend data points for a connector.
 * Proactively models natural variability, micro-spikes, and escalating latency cascades.
 */
export function generateConnectorLatencyTrends(
  connector: Connector,
  simulatedSpikeMs: number = 0,
  isMitigated: boolean = false
): {
  points: ConnectorLatencyHistoricalPoint[];
  baselineMs: number;
  failureThresholdMs: number;
  currentLatencyMs: number;
  p99LatencyMs: number;
  jitterMs: number;
  consecutiveSpikes: number;
  spikeVelocity: number;
} {
  const config = CONNECTOR_BASELINES[connector.id] || {
    baselineMs: connector.latencyMs || 30,
    failureThresholdMs: 400,
    providerType: connector.provider || 'Enterprise REST API',
  };

  const baselineMs = config.baselineMs;
  const failureThresholdMs = config.failureThresholdMs;

  // Determine if this connector is naturally exhibiting an escalating latency anomaly
  // NetSuite and Oracle Fusion or connectors with custom simulated spikes will show pre-failure escalation
  const hasNaturalDegradation =
    connector.id === 'conn-netsuite-erp' ||
    connector.id === 'conn-oracle-fusion' ||
    simulatedSpikeMs > 0;

  const points: ConnectorLatencyHistoricalPoint[] = [];
  const baseTime = new Date('2026-08-14T04:00:00Z');
  let consecutiveSpikes = 0;

  // 24 hourly time slots (from 23 hours ago to current hour)
  for (let i = 23; i >= 0; i--) {
    const pointDate = new Date(baseTime.getTime() - i * 60 * 60 * 1000);
    const hour = pointDate.getUTCHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const timeLabel = `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
    const fullTimeLabel = `Aug 14, ${timeLabel}`;

    // Base noise and sinusoidal circadian load
    const circadianLoad = Math.sin((hour / 24) * Math.PI * 2) * (baselineMs * 0.18);
    let sampleLatency = baselineMs + circadianLoad + (Math.sin(i * 1.7) * (baselineMs * 0.12));
    let errorRate = 0.05 + Math.random() * 0.15;
    let throttling429 = 0;
    let activeSockets = Math.round(12 + Math.random() * 8);
    let throughputRps = Math.round(120 + Math.sin(i * 0.9) * 45);

    // If degraded, model an exponential latency spike curve in the last 8 hours
    if (hasNaturalDegradation && !isMitigated) {
      if (i <= 7) {
        const severityStep = (7 - i) / 7; // 0 to 1
        const spikeMultiplier =
          connector.id === 'conn-netsuite-erp'
            ? 1 + Math.pow(severityStep, 1.8) * 6.2 // Huge spike for NetSuite (up to ~380ms)
            : connector.id === 'conn-oracle-fusion'
            ? 1 + Math.pow(severityStep, 1.5) * 3.8 // Moderate-High spike for Oracle (~160ms)
            : 1 + Math.pow(severityStep, 1.6) * (simulatedSpikeMs / baselineMs);

        sampleLatency = baselineMs * spikeMultiplier + (simulatedSpikeMs * severityStep);
        errorRate = parseFloat((0.2 + Math.pow(severityStep, 2.2) * 14.5).toFixed(2));
        throttling429 = Math.round(Math.pow(severityStep, 2) * 38);
        activeSockets = Math.min(100, Math.round(25 + severityStep * 68));
        throughputRps = Math.max(15, Math.round(120 - severityStep * 85));
      }
    } else if (isMitigated && hasNaturalDegradation) {
      // If mitigated, shows earlier spike that has now smoothly stabilized down to normal
      if (i > 4 && i <= 10) {
        sampleLatency = baselineMs * 2.8;
        errorRate = 4.2;
      } else if (i <= 4) {
        // Stabilization cooldown curve
        const cooldown = (4 - i) / 4;
        sampleLatency = baselineMs + (baselineMs * 0.3 * (1 - cooldown));
        errorRate = parseFloat((0.15 + (1 - cooldown) * 0.6).toFixed(2));
        throttling429 = 0;
      }
    }

    // Add instantaneous injection if testing
    if (i === 0 && simulatedSpikeMs > 0 && !isMitigated) {
      sampleLatency += simulatedSpikeMs;
      errorRate = Math.min(100, errorRate + (simulatedSpikeMs / 50));
      throttling429 += Math.round(simulatedSpikeMs / 20);
    }

    sampleLatency = Math.max(8, Math.round(sampleLatency));

    // Calculate percentiles and jitter
    const jitter = Math.round(sampleLatency * (0.08 + (sampleLatency > baselineMs * 1.8 ? 0.32 : 0.05)));
    const p50 = Math.round(sampleLatency * 0.94);
    const p95 = Math.round(sampleLatency * 1.35 + jitter);
    const p99 = Math.round(sampleLatency * 1.78 + jitter * 1.8);

    const spikeMagnitudePct = Math.round(((sampleLatency - baselineMs) / baselineMs) * 100);
    const isSpike = sampleLatency >= baselineMs * 1.85 || p99 >= failureThresholdMs * 0.75;

    let spikeSeverity: 'Critical' | 'Warning' | 'None' = 'None';
    let triggerReason = 'Normal operational variance';

    if (sampleLatency >= baselineMs * 3.0 || p99 >= failureThresholdMs * 0.9) {
      spikeSeverity = 'Critical';
      triggerReason = 'P99 Latency approaching socket timeout limit';
      consecutiveSpikes++;
    } else if (isSpike) {
      spikeSeverity = 'Warning';
      triggerReason = 'Latency exceeds 1.85x baseline threshold';
      consecutiveSpikes++;
    } else {
      consecutiveSpikes = 0;
    }

    points.push({
      timestamp: timeLabel,
      fullTimeLabel,
      isoTimestamp: pointDate.toISOString(),
      latencyMs: sampleLatency,
      baselineLatencyMs: baselineMs,
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      jitterMs: jitter,
      errorRatePct: errorRate,
      throttling429Count: throttling429,
      isSpike,
      spikeMagnitudePct,
      activeSockets,
      throughputRps,
      spikeSeverity,
      triggerReason,
    });
  }

  const latest = points[points.length - 1];
  const previous3Hours = points.slice(-4);
  const latencyDelta3h = latest.latencyMs - previous3Hours[0].latencyMs;
  const spikeVelocity = parseFloat((latencyDelta3h / 3).toFixed(1)); // ms/hour

  return {
    points,
    baselineMs,
    failureThresholdMs,
    currentLatencyMs: latest.latencyMs,
    p99LatencyMs: latest.p99Ms,
    jitterMs: latest.jitterMs,
    consecutiveSpikes,
    spikeVelocity,
  };
}

/**
 * Projects latency forward 6 hours into the future using trend velocity and confidence bands.
 */
export function forecastConnectorFailure(
  historicalPoints: ConnectorLatencyHistoricalPoint[],
  baselineMs: number,
  failureThresholdMs: number,
  isMitigated: boolean = false
): {
  forecastPoints: LatencyForecastPoint[];
  predictedFailureWindow: string;
  failureProbability: number;
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Nominal';
} {
  const latest = historicalPoints[historicalPoints.length - 1];
  const latestLatency = latest.latencyMs;

  const last4 = historicalPoints.slice(-4);
  const slope = (latestLatency - last4[0].latencyMs) / 3; // rate of change per hour

  const forecastPoints: LatencyForecastPoint[] = [];
  let timeToBreachHours: number | null = null;

  for (let h = 1; h <= 6; h++) {
    const futureHour = (new Date().getUTCHours() + h) % 24;
    const ampm = futureHour >= 12 ? 'PM' : 'AM';
    const displayHour = futureHour % 12 === 0 ? 12 : futureHour % 12;
    const timeLabel = `+${h}h (${displayHour.toString().padStart(2, '0')}:00 ${ampm})`;

    let predictedLatency: number;

    if (isMitigated) {
      // Mitigated curve: asymptotes gently down towards baseline
      const decay = Math.exp(-h * 0.8);
      predictedLatency = baselineMs + (latestLatency - baselineMs) * decay;
    } else if (slope > 5) {
      // Escalating upward trajectory with exponential compound growth
      predictedLatency = latestLatency + slope * h * (1 + h * 0.15);
    } else if (slope < -5) {
      // Natural recovery
      predictedLatency = Math.max(baselineMs, latestLatency + slope * h);
    } else {
      // Stable variance around current
      predictedLatency = latestLatency + (Math.sin(h) * baselineMs * 0.1);
    }

    predictedLatency = Math.max(5, Math.round(predictedLatency));

    // Confidence bands widen further into the future
    const confidenceMargin = Math.round(predictedLatency * (0.08 + h * 0.05));
    const upperConfidence = predictedLatency + confidenceMargin;
    const lowerConfidence = Math.max(baselineMs * 0.8, predictedLatency - confidenceMargin);

    const isBreachExpected = upperConfidence >= failureThresholdMs || predictedLatency >= failureThresholdMs;

    if (isBreachExpected && timeToBreachHours === null) {
      timeToBreachHours = h;
    }

    const predictedErrorRate = parseFloat(
      Math.min(99, Math.max(0.1, (predictedLatency / failureThresholdMs) * 18.5)).toFixed(1)
    );

    forecastPoints.push({
      timestamp: timeLabel,
      predictedLatencyMs: predictedLatency,
      upperConfidenceMs: upperConfidence,
      lowerConfidenceMs: lowerConfidence,
      failureThresholdMs,
      predictedErrorRatePct: predictedErrorRate,
      isBreachExpected,
    });
  }

  // Calculate Risk Score & Window
  let riskScore = 0;
  let riskLevel: 'Critical' | 'High' | 'Moderate' | 'Nominal' = 'Nominal';
  let predictedFailureWindow = 'Nominal (>48h)';
  let failureProbability = 4.2;

  if (isMitigated) {
    riskScore = Math.min(22, Math.round((latestLatency / failureThresholdMs) * 30));
    riskLevel = 'Nominal';
    predictedFailureWindow = 'Mitigated / Stabilized';
    failureProbability = 5.8;
  } else {
    // Scoring logic based on current latency ratio, P99 breach, slope velocity, and error rate
    const latencyRatio = latestLatency / baselineMs;
    const thresholdProximity = latestLatency / failureThresholdMs;

    let rawScore = (thresholdProximity * 55) + (Math.max(0, slope) * 0.45) + (latest.errorRatePct * 2.5);

    if ((latest.consecutiveSpikes || 0) >= 3) rawScore += 20;
    if (latestLatency >= failureThresholdMs * 0.85) rawScore += 25;

    riskScore = Math.min(98, Math.max(5, Math.round(rawScore)));

    if (riskScore >= 80) {
      riskLevel = 'Critical';
      failureProbability = parseFloat((82 + Math.random() * 14).toFixed(1));
      if (timeToBreachHours !== null && timeToBreachHours <= 1) {
        predictedFailureWindow = '~20 - 45 mins';
      } else if (timeToBreachHours !== null) {
        predictedFailureWindow = `Within ~${timeToBreachHours} hours`;
      } else {
        predictedFailureWindow = '< 1.5 hours';
      }
    } else if (riskScore >= 60) {
      riskLevel = 'High';
      failureProbability = parseFloat((62 + Math.random() * 15).toFixed(1));
      predictedFailureWindow = 'Within ~2 - 4 hours';
    } else if (riskScore >= 35) {
      riskLevel = 'Moderate';
      failureProbability = parseFloat((35 + Math.random() * 15).toFixed(1));
      predictedFailureWindow = 'Within ~8 - 14 hours (Elevated Jitter)';
    } else {
      riskLevel = 'Nominal';
      failureProbability = parseFloat((4 + Math.random() * 8).toFixed(1));
      predictedFailureWindow = 'Nominal (>48h)';
    }
  }

  return {
    forecastPoints,
    predictedFailureWindow,
    failureProbability,
    riskScore,
    riskLevel,
  };
}

/**
 * Diagnoses precise root-cause anomalies for high latency spikes.
 */
export function generateSpikeRootCauses(
  connector: Connector,
  currentLatencyMs: number,
  p99LatencyMs: number,
  baselineMs: number,
  failureThresholdMs: number,
  jitterMs: number,
  errorRatePct: number,
  isMitigated: boolean = false
): SpikeRootCause[] {
  const causes: SpikeRootCause[] = [];

  if (isMitigated) {
    causes.push({
      id: 'rc-mitigated-01',
      factor: 'Proactive Throttle & Buffer Mitigation Active',
      severity: 'Info',
      metricValue: 'Stabilized at nominal baseline',
      impactSummary: 'Adaptive exponential backoff and payload compression have successfully lowered socket pressure.',
      recommendedAction: 'Keep adaptive throttling enabled during high concurrency batch migration windows.',
    });
    return causes;
  }

  const ratio = (currentLatencyMs / baselineMs).toFixed(1);

  if (currentLatencyMs >= baselineMs * 2.2 || p99LatencyMs >= failureThresholdMs * 0.8) {
    causes.push({
      id: 'rc-p99-escalation',
      factor: 'Exponential P99 Tail Latency Degradation',
      severity: 'Critical',
      metricValue: `${p99LatencyMs}ms P99 (${ratio}x baseline of ${baselineMs}ms)`,
      impactSummary: `The 99th percentile response time is within ${Math.round(failureThresholdMs - p99LatencyMs)}ms of the hard socket timeout threshold (${failureThresholdMs}ms).`,
      recommendedAction: 'Engage adaptive exponential backoff to reduce concurrency on saturated upstream endpoints.',
    });
  }

  if (jitterMs > 35) {
    causes.push({
      id: 'rc-socket-jitter',
      factor: 'High Connection Jitter & Packet Variance',
      severity: jitterMs > 60 ? 'Critical' : 'Warning',
      metricValue: `±${jitterMs}ms Jitter Deviation`,
      impactSummary: 'Erratic packet transit times indicate network queue bufferbloat or upstream gateway rate limiting.',
      recommendedAction: 'Enable socket keep-alive recycling and switch to redundant DNS ingress gateway.',
    });
  }

  if (errorRatePct > 2.0) {
    causes.push({
      id: 'rc-http-429-cascade',
      factor: 'Upstream HTTP 429 & Gateway Timeout Cascade',
      severity: 'Critical',
      metricValue: `${errorRatePct}% Error / Throttling Rate`,
      impactSummary: 'Upstream server is rejecting requests with HTTP 429 (Too Many Requests) and HTTP 504 Gateway Timeouts.',
      recommendedAction: 'Activate automated rate limit cooldown and reduce maximum parallel worker threads.',
    });
  } else {
    causes.push({
      id: 'rc-thread-pressure',
      factor: 'Worker Concurrency & Connection Pool Saturation',
      severity: 'Warning',
      metricValue: '84% Socket Pool Allocation',
      impactSummary: 'Active worker threads are queued waiting for available keep-alive socket descriptors.',
      recommendedAction: 'Scale connection pool size from 12 to 24 workers or enable in-flight payload compression.',
    });
  }

  return causes;
}

/**
 * Generates proactive, 1-click executable remediation actions for a connector.
 */
export function generateRecommendedMitigations(
  connector: Connector,
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Nominal'
): ProactiveMitigationAction[] {
  return [
    {
      id: 'act-adaptive-rate-limit',
      title: 'Apply Adaptive Dynamic Rate-Limiter Backoff',
      actionType: 'AUTO_RATE_LIMIT',
      estimatedRiskReductionPct: 45,
      description:
        'Automatically limits request dispatch rate to 40 req/s and engages exponential backoff with jitter on HTTP 429 response codes.',
      isApplied: false,
    },
    {
      id: 'act-enable-compression',
      title: 'Enable In-Flight LZ4 / Zstandard Payload Compression',
      actionType: 'ENABLE_COMPRESSION',
      estimatedRiskReductionPct: 25,
      description:
        'Compresses wire payloads by 3.8x before socket transmission, slashing network serialization overhead and buffer saturation.',
      isApplied: false,
    },
    {
      id: 'act-recycle-sockets',
      title: 'Flush & Recycle Saturated Keep-Alive Connection Pools',
      actionType: 'SOCKET_RECYCLE',
      estimatedRiskReductionPct: 20,
      description:
        'Gracefully drains idle TCP sockets, terminates hanging TLS handshakes, and re-allocates clean worker descriptor pools.',
      isApplied: false,
    },
    {
      id: 'act-failover-replica',
      title: 'Switch Egress Routing to Secondary Regional Node',
      actionType: 'FAILOVER_REPLICA',
      estimatedRiskReductionPct: 35,
      description:
        'Reroutes synchronous data extraction tasks to the warm standby replica node with 0 downtime.',
      isApplied: false,
    },
  ];
}

/**
 * Master analyzer that inspects a connector and produces a comprehensive failure prediction report.
 */
export function analyzeConnectorFailurePrediction(
  connector: Connector,
  options?: {
    simulatedSpikeMs?: number;
    isMitigated?: boolean;
    appliedActionIds?: string[];
  }
): ConnectorFailurePrediction {
  const simulatedSpike = options?.simulatedSpikeMs || 0;
  const isMitigated = options?.isMitigated || false;

  const trends = generateConnectorLatencyTrends(connector, simulatedSpike, isMitigated);

  const forecast = forecastConnectorFailure(
    trends.points,
    trends.baselineMs,
    trends.failureThresholdMs,
    isMitigated
  );

  const rootCauses = generateSpikeRootCauses(
    connector,
    trends.currentLatencyMs,
    trends.p99LatencyMs,
    trends.baselineMs,
    trends.failureThresholdMs,
    trends.jitterMs,
    trends.points[trends.points.length - 1].errorRatePct,
    isMitigated
  );

  const mitigations = generateRecommendedMitigations(connector, forecast.riskLevel);

  // Mark applied actions if any
  if (options?.appliedActionIds && options.appliedActionIds.length > 0) {
    mitigations.forEach((m) => {
      if (options.appliedActionIds?.includes(m.id)) {
        m.isApplied = true;
      }
    });
  }

  // Determine health grade
  let healthGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (forecast.riskScore >= 80) healthGrade = 'F';
  else if (forecast.riskScore >= 60) healthGrade = 'D';
  else if (forecast.riskScore >= 40) healthGrade = 'C';
  else if (forecast.riskScore >= 20) healthGrade = 'B';
  else healthGrade = 'A';

  // Primary risk factor summary phrase
  let primaryRiskFactor = 'Latency metrics nominal within healthy baseline threshold.';
  if (forecast.riskLevel === 'Critical') {
    primaryRiskFactor = `Critical P99 Latency Spike (+${trends.currentLatencyMs - trends.baselineMs}ms) threatening socket timeout breach`;
  } else if (forecast.riskLevel === 'High') {
    primaryRiskFactor = `Progressive Latency Escalation (+${trends.spikeVelocity} ms/h) & Elevated Jitter`;
  } else if (forecast.riskLevel === 'Moderate') {
    primaryRiskFactor = 'Mild latency variance & intermittent HTTP 429 backoff';
  } else if (isMitigated) {
    primaryRiskFactor = 'Stabilized via proactive dynamic backoff mitigation';
  }

  return {
    connectorId: connector.id,
    connectorName: connector.name,
    calculatedAt: new Date().toISOString(),
    riskScore: forecast.riskScore,
    riskLevel: forecast.riskLevel,
    predictedFailureWindow: forecast.predictedFailureWindow,
    failureProbability: forecast.failureProbability,
    primaryRiskFactor,
    baselineLatencyMs: trends.baselineMs,
    currentLatencyMs: trends.currentLatencyMs,
    p99LatencyMs: trends.p99LatencyMs,
    spikeVelocityMsPerHour: trends.spikeVelocity,
    jitterMs: trends.jitterMs,
    consecutiveSpikeCount: trends.consecutiveSpikes,
    timeSeriesTrends: trends.points,
    forecastPoints: forecast.forecastPoints,
    rootCauses,
    recommendedMitigations: mitigations,
    spikeFrequencyLast24h: trends.points.filter((p) => p.isSpike).length,
    meanTimeToRecoveryEstimateMin: forecast.riskLevel === 'Critical' ? 45 : forecast.riskLevel === 'High' ? 25 : 10,
    healthGrade,
    isMitigated,
  };
}
