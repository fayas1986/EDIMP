import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAgentsService } from './ai-agents.service';
import {
  TriggerAiMappingSuggestionDto,
  TriggerAiDriftRepairDto,
  TriggerAiAnomalyAnalysisDto,
  ExecuteNaturalLanguageQueryDto,
  AcceptAiSuggestionDto,
  RejectAiSuggestionDto,
} from '@edimp/contracts';

@ApiTags('AI Agents & Autonomous Skills')
@Controller()
export class AiAgentsController {
  constructor(private readonly aiAgentsService: AiAgentsService) {}

  @Post('workspaces/:workspaceId/ai/mapping-suggestions')
  @ApiOperation({ summary: 'Trigger asynchronous mapping suggestion task with score breakdowns & provenance' })
  @ApiResponse({ status: 201, description: 'AI agent task created or reused via idempotency hash' })
  async triggerMappingSuggestions(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiMappingSuggestionDto
  ) {
    return this.aiAgentsService.triggerMappingSuggestionTask(workspaceId, dto);
  }

  @Post('ai-suggestions/:suggestionId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept AI suggestion (Advisory Gate: Creates new DRAFT version, never mutates published version)' })
  @ApiResponse({ status: 200, description: 'Suggestion accepted and new draft version created' })
  async acceptSuggestion(
    @Param('suggestionId') suggestionId: string,
    @Headers('x-workspace-id') workspaceHeader: string,
    @Headers('x-user-id') userHeader: string,
    @Body() dto: AcceptAiSuggestionDto
  ) {
    const workspaceId = workspaceHeader || 'ws_phase7_default';
    const userId = userHeader || 'usr_phase7_default';
    return this.aiAgentsService.acceptMappingSuggestion(workspaceId, suggestionId, userId, dto);
  }

  @Post('ai-suggestions/:suggestionId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject AI suggestion with audit reason' })
  @ApiResponse({ status: 200, description: 'Suggestion rejected' })
  async rejectSuggestion(
    @Param('suggestionId') suggestionId: string,
    @Headers('x-workspace-id') workspaceHeader: string,
    @Headers('x-user-id') userHeader: string,
    @Body() dto: RejectAiSuggestionDto
  ) {
    const workspaceId = workspaceHeader || 'ws_phase7_default';
    const userId = userHeader || 'usr_phase7_default';
    return this.aiAgentsService.rejectMappingSuggestion(workspaceId, suggestionId, userId, dto);
  }

  @Post('workspaces/:workspaceId/ai/schema-drift')
  @ApiOperation({ summary: 'Trigger schema drift repair agent (Detects renames, added/removed fields, computes severity)' })
  @ApiResponse({ status: 201, description: 'Schema drift task created' })
  async triggerSchemaDrift(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiDriftRepairDto
  ) {
    return this.aiAgentsService.triggerDriftRepairTask(workspaceId, dto);
  }

  @Post('workspaces/:workspaceId/ai/anomaly-analysis')
  @ApiOperation({ summary: 'Trigger anomaly detection agent (Enforces sufficient sample baseline)' })
  @ApiResponse({ status: 201, description: 'Anomaly analysis task created' })
  async triggerAnomalyAnalysis(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiAnomalyAnalysisDto
  ) {
    return this.aiAgentsService.triggerAnomalyAnalysisTask(workspaceId, dto);
  }

  @Post('workspaces/:workspaceId/ai/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute read-only controlled natural language query (Zod validated query plan)' })
  @ApiResponse({ status: 200, description: 'Read-only query results returned' })
  async executeNaturalLanguageQuery(
    @Param('workspaceId') workspaceId: string,
    @Headers('x-user-id') userHeader: string,
    @Body() dto: ExecuteNaturalLanguageQueryDto
  ) {
    const userId = userHeader || 'usr_phase7_default';
    return this.aiAgentsService.executeNaturalLanguageQuery(workspaceId, userId, dto);
  }

  @Get('workspaces/:workspaceId/ai/tasks')
  @ApiOperation({ summary: 'List AI agent task execution history in workspace' })
  @ApiResponse({ status: 200, description: 'List of AI agent tasks' })
  async listWorkspaceTasks(@Param('workspaceId') workspaceId: string) {
    return this.aiAgentsService.listWorkspaceTasks(workspaceId);
  }
}
