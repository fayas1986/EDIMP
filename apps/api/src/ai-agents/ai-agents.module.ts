import { Module } from '@nestjs/common';
import { AiAgentsService } from './ai-agents.service';
import { AiAgentsController } from './ai-agents.controller';
import { DeterministicProvider } from './providers/deterministic-provider';
import { OpenAiProvider } from './providers/openai-provider';

@Module({
  controllers: [AiAgentsController],
  providers: [
    AiAgentsService,
    DeterministicProvider,
    OpenAiProvider,
  ],
  exports: [AiAgentsService],
})
export class AiAgentsModule {}
