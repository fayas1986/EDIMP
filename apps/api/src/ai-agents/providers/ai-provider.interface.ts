export interface FieldDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  sampleValues?: string[];
}

export interface MappingAgentInput {
  workspaceId: string;
  sourceFields: FieldDefinition[];
  targetFields: FieldDefinition[];
  confidenceThreshold?: number;
}

export interface RawMappingRecommendation {
  sourceEntity: string;
  sourceField: string;
  targetEntity: string;
  targetField: string | null; // null for NO_RECOMMENDATION
  suggestedTransform?: string;
  suggestedValidation?: string;
  nameScore: number;
  semanticScore: number;
  typeCompatibilityScore: number;
  profileScore: number;
  finalConfidenceScore: number;
  reasoning: string;
  evidence: Record<string, any>;
}

export interface DriftAgentInput {
  workspaceId: string;
  baselineFields: FieldDefinition[];
  targetFields: FieldDefinition[];
  entityName: string;
}

export interface RawDriftRecommendation {
  entityName: string;
  fieldName?: string;
  renamedToFieldName?: string;
  category: 'ADDED_FIELD' | 'REMOVED_FIELD' | 'RENAME_CANDIDATE' | 'TYPE_MUTATION' | 'NULLABILITY_CHANGE' | 'ENTITY_REMOVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number;
  reasoning: string;
  suggestedRepairPlan: Record<string, any>;
}

export interface AnomalyAgentInput {
  workspaceId: string;
  numericValues?: number[];
  discrepancyType?: string;
  fieldIdentifier?: string;
}

export interface RawAnomalyRecommendation {
  anomalyType: 'NUMERIC_OUTLIER' | 'PATTERN_MUTATION' | 'NULL_SPIKE' | 'TIMEZONE_OFFSET' | 'CURRENCY_CONVERSION' | 'TRUNCATION_RISK' | 'INSUFFICIENT_BASELINE';
  confidenceScore: number;
  sampleSize?: number;
  meanValue?: number;
  stdDevValue?: number;
  medianValue?: number;
  iqrValue?: number;
  zScoreValue?: number;
  thresholdUsed?: number;
  statisticalEvidence: Record<string, any>;
  rootCauseAnalysis: string;
  recommendedAction: string;
}

export interface NlQueryInput {
  workspaceId: string; // Server enforced
  environmentId: string; // Server enforced
  prompt: string;
}

export interface AiProvider {
  readonly providerName: string;
  
  generateMappingSuggestions(input: MappingAgentInput): Promise<RawMappingRecommendation[]>;
  detectSchemaDrift(input: DriftAgentInput): Promise<RawDriftRecommendation[]>;
  analyzeAnomalies(input: AnomalyAgentInput): Promise<RawAnomalyRecommendation[]>;
  parseNaturalLanguageQuery(input: NlQueryInput): Promise<Record<string, any>>;
}

export class SanitizationUtil {
  /**
   * Sanitizes input metadata before passing to external LLM providers.
   * Excludes raw credentials, tokens, PII, and full database records.
   */
  static sanitizeFields(fields: FieldDefinition[]): FieldDefinition[] {
    return fields.map(f => ({
      name: f.name.replace(/[^a-zA-Z0-9_]/g, ''),
      type: f.type,
      nullable: f.nullable,
      // Strip sample values if they contain sensitive string patterns (emails, tokens, SSNs)
      sampleValues: f.sampleValues
        ? f.sampleValues.map(val => (this.isPii(val) ? '[REDACTED_PII]' : val.substring(0, 20)))
        : undefined,
    }));
  }

  private static isPii(val: string): boolean {
    if (!val || typeof val !== 'string') return false;
    // Simple PII regex checks (email, token, credit card, phone)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const bearerRegex = /bearer\s+[a-z0-9\-\._~\+\/]+=*/i;
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return emailRegex.test(val) || bearerRegex.test(val) || phoneRegex.test(val);
  }
}
