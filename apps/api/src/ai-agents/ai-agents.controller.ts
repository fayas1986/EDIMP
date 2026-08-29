import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AiAgentsService } from './ai-agents.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import {
  TriggerAiMappingSuggestionDto,
  TriggerAiDriftRepairDto,
  TriggerAiAnomalyAnalysisDto,
  ExecuteNaturalLanguageQueryDto,
  AcceptAiSuggestionDto,
  RejectAiSuggestionDto,
  PaginationQuerySchema,
  PaginationQueryDto,
  PaginatedResult,
  AiAgentTaskResponse,
  AsyncOperationResponse,
  AcceptAiSuggestionResponse,
  AiMappingSuggestionResponse,
  ExecuteNaturalLanguageQueryResponse,
} from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('AI Agents & Autonomous Skills')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class AiAgentsController {
  constructor(private readonly aiAgentsService: AiAgentsService) {}

  @Post('workspaces/:workspaceId/ai/mapping-suggestions')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger asynchronous mapping suggestion task with score breakdowns & provenance' })
  @ApiResponse({ status: 202, description: 'AI agent task created or reused via idempotency hash' })
  async triggerMappingSuggestions(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiMappingSuggestionDto
  ): Promise<AsyncOperationResponse> {
    return this.aiAgentsService.triggerMappingSuggestionTask(workspaceId, dto);
  }

  @Post('ai-suggestions/:suggestionId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept AI suggestion (Advisory Gate: Creates new DRAFT version, never mutates published version)' })
  @ApiResponse({ status: 200, description: 'Suggestion accepted and new draft version created' })
  async acceptSuggestion(
    @Param('suggestionId') suggestionId: string,
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: AcceptAiSuggestionDto
  ): Promise<AcceptAiSuggestionResponse> {
    return this.aiAgentsService.acceptMappingSuggestion(workspaceId, suggestionId, user.id, dto) as any;
  }

  @Post('ai-suggestions/:suggestionId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject AI suggestion with audit reason' })
  @ApiResponse({ status: 200, description: 'Suggestion rejected' })
  async rejectSuggestion(
    @Param('suggestionId') suggestionId: string,
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: RejectAiSuggestionDto
  ): Promise<AiMappingSuggestionResponse> {
    return this.aiAgentsService.rejectMappingSuggestion(workspaceId, suggestionId, user.id, dto) as any;
  }

  @Post('workspaces/:workspaceId/ai/schema-drift')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger schema drift repair agent (Detects renames, added/removed fields, computes severity)' })
  @ApiResponse({ status: 202, description: 'Schema drift task created' })
  async triggerSchemaDrift(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiDriftRepairDto
  ): Promise<AsyncOperationResponse> {
    return this.aiAgentsService.triggerDriftRepairTask(workspaceId, dto);
  }

  @Post('workspaces/:workspaceId/ai/anomaly-analysis')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger anomaly detection agent (Enforces sufficient sample baseline)' })
  @ApiResponse({ status: 202, description: 'Anomaly analysis task created' })
  async triggerAnomalyAnalysis(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: TriggerAiAnomalyAnalysisDto
  ): Promise<AsyncOperationResponse> {
    return this.aiAgentsService.triggerAnomalyAnalysisTask(workspaceId, dto);
  }

  @Post('workspaces/:workspaceId/ai/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Controlled Read-Only Natural Language Query Execution' })
  @ApiResponse({ status: 200, description: 'Query results returned' })
  async executeNaturalLanguageQuery(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ExecuteNaturalLanguageQueryDto
  ): Promise<ExecuteNaturalLanguageQueryResponse> {
    return this.aiAgentsService.executeNaturalLanguageQuery(workspaceId, user.id, dto) as any;
  }

  @Get('workspaces/:workspaceId/ai/tasks')
  @ApiOperation({ summary: 'List AI agent task execution history in workspace' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of AI agent tasks' })
  async listWorkspaceTasks(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
  ): Promise<PaginatedResult<AiAgentTaskResponse>> {
    return this.aiAgentsService.listWorkspaceTasks(workspaceId, query);
  }
}
