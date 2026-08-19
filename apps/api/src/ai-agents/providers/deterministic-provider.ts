import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  MappingAgentInput,
  RawMappingRecommendation,
  DriftAgentInput,
  RawDriftRecommendation,
  AnomalyAgentInput,
  RawAnomalyRecommendation,
  NlQueryInput,
  FieldDefinition,
} from './ai-provider.interface';

@Injectable()
export class DeterministicProvider implements AiProvider {
  readonly providerName = 'DETERMINISTIC';

  async generateMappingSuggestions(input: MappingAgentInput): Promise<RawMappingRecommendation[]> {
    const threshold = input.confidenceThreshold ?? 0.70;
    const recommendations: RawMappingRecommendation[] = [];

    for (const src of input.sourceFields) {
      let bestMatch: { target: FieldDefinition; scores: { name: number; semantic: number; type: number; profile: number; final: number } } | null = null;

      for (const tgt of input.targetFields) {
        const scores = this.calculateMappingScores(src, tgt);
        if (!bestMatch || scores.final > bestMatch.scores.final) {
          bestMatch = { target: tgt, scores };
        }
      }

      if (bestMatch && bestMatch.scores.final >= threshold) {
        let suggestedTransform: string | undefined;
        if (src.type !== bestMatch.target.type) {
          if (src.type.includes('CHAR') && bestMatch.target.type.includes('INT')) {
            suggestedTransform = 'CAST';
          } else if (src.type.includes('CHAR') && bestMatch.target.type.includes('DATE')) {
            suggestedTransform = 'DATE_FORMAT';
          } else if (src.type.includes('CHAR')) {
            suggestedTransform = 'TRIM';
          }
        }

        recommendations.push({
          sourceEntity: 'SourceEntity',
          sourceField: src.name,
          targetEntity: 'TargetEntity',
          targetField: bestMatch.target.name,
          suggestedTransform,
          nameScore: bestMatch.scores.name,
          semanticScore: bestMatch.scores.semantic,
          typeCompatibilityScore: bestMatch.scores.type,
          profileScore: bestMatch.scores.profile,
          finalConfidenceScore: Number(bestMatch.scores.final.toFixed(4)),
          reasoning: `Matched '${src.name}' to '${bestMatch.target.name}' with confidence ${bestMatch.scores.final.toFixed(2)} based on name/type similarity.`,
          evidence: {
            nameSimilarity: bestMatch.scores.name,
            semanticSimilarity: bestMatch.scores.semantic,
            typeMatch: src.type === bestMatch.target.type,
          },
        });
      } else {
        // Explicit NO_RECOMMENDATION
        recommendations.push({
          sourceEntity: 'SourceEntity',
          sourceField: src.name,
          targetEntity: 'TargetEntity',
          targetField: null, // NO_RECOMMENDATION
          nameScore: bestMatch ? bestMatch.scores.name : 0,
          semanticScore: bestMatch ? bestMatch.scores.semantic : 0,
          typeCompatibilityScore: bestMatch ? bestMatch.scores.type : 0,
          profileScore: bestMatch ? bestMatch.scores.profile : 0,
          finalConfidenceScore: bestMatch ? Number(bestMatch.scores.final.toFixed(4)) : 0,
          reasoning: `No target candidate met the confidence threshold of ${threshold}. Returning NO_RECOMMENDATION.`,
          evidence: { threshold, highestScoreFound: bestMatch ? bestMatch.scores.final : 0 },
        });
      }
    }

    return recommendations;
  }

  async detectSchemaDrift(input: DriftAgentInput): Promise<RawDriftRecommendation[]> {
    const recommendations: RawDriftRecommendation[] = [];
    const baselineMap = new Map(input.baselineFields.map(f => [f.name, f]));
    const targetMap = new Map(input.targetFields.map(f => [f.name, f]));

    const missingInTarget: FieldDefinition[] = [];
    const addedInTarget: FieldDefinition[] = [];

    // Find missing fields in target
    for (const [name, bField] of baselineMap.entries()) {
      if (!targetMap.has(name)) {
        missingInTarget.push(bField);
      }
    }

    // Find added fields in target
    for (const [name, tField] of targetMap.entries()) {
      if (!baselineMap.has(name)) {
        addedInTarget.push(tField);
      } else {
        // Check type mutation or nullability change
        const bField = baselineMap.get(name)!;
        if (bField.type !== tField.type) {
          recommendations.push({
            entityName: input.entityName,
            fieldName: name,
            category: 'TYPE_MUTATION',
            severity: 'HIGH',
            confidenceScore: 0.95,
            reasoning: `Field '${name}' data type changed from '${bField.type}' to '${tField.type}'.`,
            suggestedRepairPlan: { action: 'UPDATE_CAST_TRANSFORMATION', fromType: bField.type, toType: tField.type },
          });
        }
      }
    }

    // Smart Rename Candidate Detection (Pair missing baseline fields with added target fields)
    const matchedAdded = new Set<string>();

    for (const bField of missingInTarget) {
      let bestRenameCandidate: { field: FieldDefinition; sim: number } | null = null;

      for (const tField of addedInTarget) {
        if (matchedAdded.has(tField.name)) continue;
        const sim = this.calculateSemanticSimilarity(bField.name, tField.name);
        if (sim >= 0.55 && (bField.type === tField.type || bField.nullable === tField.nullable)) {
          if (!bestRenameCandidate || sim > bestRenameCandidate.sim) {
            bestRenameCandidate = { field: tField, sim };
          }
        }
      }

      if (bestRenameCandidate) {
        matchedAdded.add(bestRenameCandidate.field.name);
        recommendations.push({
          entityName: input.entityName,
          fieldName: bField.name,
          renamedToFieldName: bestRenameCandidate.field.name,
          category: 'RENAME_CANDIDATE',
          severity: 'MEDIUM',
          confidenceScore: Number(bestRenameCandidate.sim.toFixed(2)),
          reasoning: `Field '${bField.name}' appears to be renamed to '${bestRenameCandidate.field.name}' based on name similarity (${bestRenameCandidate.sim.toFixed(2)}) and data type '${bField.type}'.`,
          suggestedRepairPlan: { action: 'UPDATE_FIELD_MAPPING_NAME', oldName: bField.name, newName: bestRenameCandidate.field.name },
        });
      } else {
        recommendations.push({
          entityName: input.entityName,
          fieldName: bField.name,
          category: 'REMOVED_FIELD',
          severity: bField.nullable === false ? 'CRITICAL' : 'HIGH',
          confidenceScore: 0.90,
          reasoning: `Field '${bField.name}' was removed from target schema.`,
          suggestedRepairPlan: { action: 'REMOVE_OR_FALLBACK', fieldName: bField.name },
        });
      }
    }

    for (const tField of addedInTarget) {
      if (!matchedAdded.has(tField.name)) {
        recommendations.push({
          entityName: input.entityName,
          fieldName: tField.name,
          category: 'ADDED_FIELD',
          severity: 'LOW',
          confidenceScore: 0.90,
          reasoning: `New field '${tField.name}' added to target schema.`,
          suggestedRepairPlan: { action: 'MAP_NEW_FIELD', fieldName: tField.name },
        });
      }
    }

    return recommendations;
  }

  async analyzeAnomalies(input: AnomalyAgentInput): Promise<RawAnomalyRecommendation[]> {
    const values = input.numericValues || [];
    
    // Insufficient Baseline Check
    if (values.length < 5) {
      return [{
        anomalyType: 'INSUFFICIENT_BASELINE',
        confidenceScore: 0.10,
        sampleSize: values.length,
        statisticalEvidence: { minRequiredSample: 5, actualSample: values.length },
        rootCauseAnalysis: `Insufficient baseline data (sample size ${values.length} < 5). Cannot make high-confidence anomaly determination.`,
        recommendedAction: 'COLLECT_MORE_DATA',
      }];
    }

    // Calculate statistical metrics
    const sampleSize = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / sampleSize;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sampleSize;
    const stdDev = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sampleSize / 2)];
    const q1 = sorted[Math.floor(sampleSize * 0.25)];
    const q3 = sorted[Math.floor(sampleSize * 0.75)];
    const iqr = q3 - q1;

    // Check outliers using Z-score and IQR
    const outliers = values.filter(v => (stdDev > 0 && Math.abs((v - mean) / stdDev) > 2.5) || (iqr > 0 && (v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr)));

    if (outliers.length > 0) {
      const maxOutlier = outliers[0];
      const maxZScore = stdDev > 0 ? (maxOutlier - mean) / stdDev : 0;

      return [{
        anomalyType: 'NUMERIC_OUTLIER',
        confidenceScore: 0.88,
        sampleSize,
        meanValue: Number(mean.toFixed(4)),
        stdDevValue: Number(stdDev.toFixed(4)),
        medianValue: Number(median.toFixed(4)),
        iqrValue: Number(iqr.toFixed(4)),
        zScoreValue: Number(maxZScore.toFixed(4)),
        thresholdUsed: 2.5,
        statisticalEvidence: {
          q1,
          q3,
          iqr,
          outlierCount: outliers.length,
          outlierValues: outliers,
        },
        rootCauseAnalysis: `Statistical numerical outlier detected. ${outliers.length} values deviated significantly from mean (${mean.toFixed(2)}) with max Z-score of ${maxZScore.toFixed(2)}.`,
        recommendedAction: 'RECOMMEND_DECIMAL_NORMALIZATION',
      }];
    }

    return [{
      anomalyType: 'PATTERN_MUTATION',
      confidenceScore: 0.75,
      sampleSize,
      meanValue: Number(mean.toFixed(4)),
      stdDevValue: Number(stdDev.toFixed(4)),
      medianValue: Number(median.toFixed(4)),
      iqrValue: Number(iqr.toFixed(4)),
      statisticalEvidence: { sampleSize, mean, stdDev },
      rootCauseAnalysis: `No severe numeric outliers found. Data distribution remains within 2.5 std-dev bounds.`,
      recommendedAction: 'RECOMMEND_MAPPING_REVIEW',
    }];
  }

  async parseNaturalLanguageQuery(input: NlQueryInput): Promise<Record<string, any>> {
    const p = input.prompt.toLowerCase();

    if (p.includes('failed') || p.includes('error')) {
      if (p.includes('run') || p.includes('migration')) {
        return {
          targetEntity: 'MIGRATION_RUN',
          action: 'FIND_MANY',
          filters: { status: 'FAILED' },
          limit: 20,
          offset: 0,
        };
      }
      return {
        targetEntity: 'RECORD_ERROR',
        action: 'FIND_MANY',
        filters: { resolutionStatus: 'OPEN' },
        limit: 20,
        offset: 0,
      };
    }

    if (p.includes('discrepanc') || p.includes('recon') || p.includes('mismatch')) {
      return {
        targetEntity: 'RECONCILIATION_DISCREPANCY',
        action: 'FIND_MANY',
        filters: { status: 'OPEN' },
        limit: 20,
        offset: 0,
      };
    }

    if (p.includes('mapping')) {
      return {
        targetEntity: 'MAPPING_SET',
        action: 'FIND_MANY',
        filters: {},
        limit: 20,
        offset: 0,
      };
    }

    return {
      targetEntity: 'DATA_MODEL',
      action: 'FIND_MANY',
      filters: {},
      limit: 20,
      offset: 0,
    };
  }

  private calculateMappingScores(src: FieldDefinition, tgt: FieldDefinition): { name: number; semantic: number; type: number; profile: number; final: number } {
    const nameScore = this.calculateStringSimilarity(src.name, tgt.name);
    const semanticScore = this.calculateSemanticSimilarity(src.name, tgt.name);
    const typeScore = src.type === tgt.type ? 1.0 : (src.type.includes('CHAR') && tgt.type.includes('CHAR') ? 0.8 : 0.4);
    const profileScore = src.nullable === tgt.nullable ? 1.0 : 0.7;

    const final = 0.40 * nameScore + 0.30 * semanticScore + 0.15 * typeScore + 0.15 * profileScore;

    return {
      name: Number(nameScore.toFixed(4)),
      semantic: Number(semanticScore.toFixed(4)),
      type: Number(typeScore.toFixed(4)),
      profile: Number(profileScore.toFixed(4)),
      final: Number(final.toFixed(4)),
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (s1 === s2) return 1.0;

    // Levenshtein distance similarity
    const len1 = s1.length;
    const len2 = s2.length;
    if (len1 === 0 || len2 === 0) return 0;

    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const dist = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return Number((1 - dist / maxLen).toFixed(4));
  }

  private calculateSemanticSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    const synonyms: Record<string, string[]> = {
      cust_no: ['customercode', 'customernumber', 'customer_number', 'customerid', 'clientid'],
      customer_code: ['customernumber', 'customer_number', 'customerid', 'clientid', 'cust_no'],
      email: ['emailaddress', 'mail', 'useremail'],
      mail: ['emailaddress', 'email', 'useremail'],
      phone: ['phonenumber', 'telephone', 'mobile'],
      amt: ['amount', 'totalamount', 'price', 'balance'],
      amount: ['amt', 'totalamount', 'price', 'balance'],
    };

    for (const [key, list] of Object.entries(synonyms)) {
      if ((n1.includes(key) || list.includes(n1)) && (n2.includes(key) || list.includes(n2))) {
        return 0.95;
      }
    }

    return this.calculateStringSimilarity(n1, n2);
  }
}
