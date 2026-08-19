import { createZodDto } from 'nestjs-zod/dto';
import { CreateWorkspaceSchema, UpdateWorkspaceSchema } from '@edimp/contracts';

export class CreateWorkspaceDto extends createZodDto(CreateWorkspaceSchema) {}
export class UpdateWorkspaceDto extends createZodDto(UpdateWorkspaceSchema) {}
