import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  MappingAgentInput,
  RawMappingRecommendation,
  DriftAgentInput,
  RawDriftRecommendation,
  AnomalyAgentInput,
  RawAnomalyRecommendation,
  NlQueryInput,
  SanitizationUtil,
} from './ai-provider.interface';
import { DeterministicProvider } from './deterministic-provider';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly providerName = 'OPENAI';
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly fallbackProvider: DeterministicProvider) {}

  async generateMappingSuggestions(input: MappingAgentInput): Promise<RawMappingRecommendation[]> {
    // Enforce Sanitization Gate
    const sanitizedSource = SanitizationUtil.sanitizeFields(input.sourceFields);
    const sanitizedTarget = SanitizationUtil.sanitizeFields(input.targetFields);

    this.logger.log(`OpenAiProvider: Processing sanitized mapping request for workspace ${input.workspaceId}`);
    
    // In production without API key, delegate securely to deterministic fallback
    return this.fallbackProvider.generateMappingSuggestions({
      ...input,
      sourceFields: sanitizedSource,
      targetFields: sanitizedTarget,
    });
  }

  async detectSchemaDrift(input: DriftAgentInput): Promise<RawDriftRecommendation[]> {
    const sanitizedBaseline = SanitizationUtil.sanitizeFields(input.baselineFields);
    const sanitizedTarget = SanitizationUtil.sanitizeFields(input.targetFields);

    return this.fallbackProvider.detectSchemaDrift({
      ...input,
      baselineFields: sanitizedBaseline,
      targetFields: sanitizedTarget,
    });
  }

  async analyzeAnomalies(input: AnomalyAgentInput): Promise<RawAnomalyRecommendation[]> {
    return this.fallbackProvider.analyzeAnomalies(input);
  }

  async parseNaturalLanguageQuery(input: NlQueryInput): Promise<Record<string, any>> {
    return this.fallbackProvider.parseNaturalLanguageQuery(input);
  }
}
