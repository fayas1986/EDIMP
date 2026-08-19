import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DataConflict {
  id: string;
  category: 'Constraint' | 'Syntax' | 'Null Value' | 'Duplicate Key';
  rule: string;
  affectedRecords: number;
  impactedField: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  actionNeeded: string;
}

export interface TransformationError {
  id: string;
  type: 'Type Coercion' | 'Truncation' | 'Unmapped Value' | 'Formula Failure';
  sourceField: string;
  targetField: string;
  errorCount: number;
  sampleFailure: string;
  remediation: string;
}

export interface BottleneckMetric {
  resource: string;
  currentValue: string;
  threshold: string;
  status: 'Optimal' | 'Warning' | 'Critical';
  bottleneckRisk: string;
  recommendation: string;
}

export interface SimulationReportData {
  pipelineName: string;
  sampleSizeRecords: number;
  samplePercentage: number;
  totalDatasetRecords: number;
  totalDatasetTB: number;
  predictedSuccessRate: number;
  estimatedErrorsCount: number;
  estimatedDurationMinutes: number;
  estimatedCloudCostUSD: number;
  peakMemoryPerNodeGB: number;
  recommendedWorkerNodes: number;
  riskSeverity: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  conflicts: DataConflict[];
  transformationErrors: TransformationError[];
  bottlenecks: BottleneckMetric[];
  remediationSteps: string[];
}

export function generateImpactAnalysisPDF(data: SimulationReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Primary Palette
  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentIndigo: [number, number, number] = [79, 70, 229]; // indigo-600
  const textDark: [number, number, number] = [15, 23, 42]; // slate-900
  const textMuted: [number, number, number] = [100, 116, 139]; // slate-500
  const borderLight: [number, number, number] = [226, 232, 240]; // slate-200
  const bgLight: [number, number, number] = [248, 250, 252]; // slate-50

  // 1. Header Banner Box
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Title & Subtitle in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MIGRATION IMPACT ANALYSIS REPORT', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Pipeline: ${data.pipelineName} | Non-Destructive Dry-Run Sandbox`, margin, 21);

  // Date/Time on right side
  const now = new Date();
  const timestampStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin, 21, { align: 'right' });

  let y = 38;

  // 2. Executive Summary Box
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...accentIndigo);
  doc.text('EXECUTIVE SIMULATION SUMMARY', margin + 4, y + 8);

  // Grid Stats inside Executive Summary Box
  const colWidth = (pageWidth - margin * 2 - 8) / 4;
  const statY = y + 16;

  // Stat 1: Predicted Success Rate
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('PREDICTED SUCCESS RATE', margin + 4, statY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${data.predictedSuccessRate}%`, margin + 4, statY + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`${data.estimatedErrorsCount.toLocaleString()} est. anomalies`, margin + 4, statY + 12);

  // Stat 2: Estimated Duration
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('PREDICTED DURATION', margin + 4 + colWidth, statY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${data.estimatedDurationMinutes} Mins`, margin + 4 + colWidth, statY + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`On ${data.recommendedWorkerNodes} Spark Worker Nodes`, margin + 4 + colWidth, statY + 12);

  // Stat 3: Cloud Run Cost
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('ESTIMATED CLOUD COST', margin + 4 + colWidth * 2, statY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`$${data.estimatedCloudCostUSD.toFixed(2)} USD`, margin + 4 + colWidth * 2, statY + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Dataset: ${data.totalDatasetTB} TB (${data.totalDatasetRecords.toLocaleString()} recs)`, margin + 4 + colWidth * 2, statY + 12);

  // Stat 4: Risk Severity
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text('RISK SEVERITY PROFILE', margin + 4 + colWidth * 3, statY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  if (data.riskSeverity === 'Low Risk') {
    doc.setTextColor(16, 185, 129);
  } else if (data.riskSeverity === 'Moderate Risk') {
    doc.setTextColor(217, 119, 6); // amber-600
  } else {
    doc.setTextColor(225, 29, 72); // rose-600
  }
  doc.text(data.riskSeverity, margin + 4 + colWidth * 3, statY + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Sampled ${data.sampleSizeRecords.toLocaleString()} records (${data.samplePercentage}%)`, margin + 4 + colWidth * 3, statY + 12);

  y += 48;

  // 3. Section: Potential Data Conflicts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('1. POTENTIAL DATA CONFLICTS & ANOMALIES IDENTIFIED', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Key integrity and constraint violations detected during dry-run pre-flight checks:', margin, y + 4);

  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Category', 'Rule Name', 'Impacted Field', 'Est. Records', 'Severity', 'Recommended Remediation']],
    body: data.conflicts.map((c) => [
      c.category,
      c.rule,
      c.impactedField,
      c.affectedRecords.toLocaleString(),
      c.severity,
      c.actionNeeded,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, fontStyle: 'bold' },
      5: { cellWidth: 'auto' },
    },
    didParseCell: function (dataCell) {
      if (dataCell.section === 'body' && dataCell.column.index === 4) {
        const val = dataCell.cell.raw as string;
        if (val === 'Critical' || val === 'High') {
          dataCell.cell.styles.textColor = [225, 29, 72]; // rose red
        } else if (val === 'Medium') {
          dataCell.cell.styles.textColor = [217, 119, 6]; // amber
        } else {
          dataCell.cell.styles.textColor = [16, 185, 129]; // emerald
        }
      }
    },
  });

  // Get final Y after table
  y = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a page break
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  // 4. Section: Transformation & Schema Coercion Errors
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('2. TRANSFORMATION ERRORS & TYPE COERCION WARNINGS', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Evaluated data transformation rules, formula expressions, and field mappings:', margin, y + 4);

  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Error Type', 'Source Field', 'Target Field', 'Failure Count', 'Sample Failure Payload', 'Remediation Rule']],
    body: data.transformationErrors.map((t) => [
      t.type,
      t.sourceField,
      t.targetField,
      t.errorCount.toLocaleString(),
      t.sampleFailure,
      t.remediation,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: accentIndigo,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 38 },
      5: { cellWidth: 'auto' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > pageHeight - 65) {
    doc.addPage();
    y = 20;
  }

  // 5. Section: Performance & Cluster Bottlenecks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('3. PERFORMANCE BOTTLENECKS & CLUSTER RESOURCE ANALYSIS', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Simulated cluster memory consumption, thread pool I/O, and throughput limits:', margin, y + 4);

  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Resource / Metric', 'Simulated Value', 'Threshold Limit', 'Status', 'Identified Bottleneck Risk', 'Tuning Recommendation']],
    body: data.bottlenecks.map((b) => [
      b.resource,
      b.currentValue,
      b.threshold,
      b.status,
      b.bottleneckRisk,
      b.recommendation,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18, fontStyle: 'bold' },
      4: { cellWidth: 42 },
      5: { cellWidth: 'auto' },
    },
    didParseCell: function (dataCell) {
      if (dataCell.section === 'body' && dataCell.column.index === 3) {
        const val = dataCell.cell.raw as string;
        if (val === 'Critical') {
          dataCell.cell.styles.textColor = [225, 29, 72];
        } else if (val === 'Warning') {
          dataCell.cell.styles.textColor = [217, 119, 6];
        } else {
          dataCell.cell.styles.textColor = [16, 185, 129];
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  // 6. Section: Actionable Remediation Roadmap
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text('4. PRE-FLIGHT ACTIONABLE REMEDIATION ROADMAP', margin, y);

  y += 6;
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderLight);
  const roadmapHeight = data.remediationSteps.length * 6 + 10;
  doc.roundedRect(margin, y, pageWidth - margin * 2, roadmapHeight, 2, 2, 'FD');

  let stepY = y + 7;
  doc.setFontSize(8);
  doc.setTextColor(...textDark);

  data.remediationSteps.forEach((step, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentIndigo);
    doc.text(`[Step ${idx + 1}]`, margin + 4, stepY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    doc.text(step, margin + 20, stepY);
    stepY += 6;
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderLight);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `EDIMP Enterprise Migration Platform v3.4 | Confidential Impact Analysis Report`,
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Save PDF
  const filename = `Impact_Analysis_Report_${data.pipelineName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
