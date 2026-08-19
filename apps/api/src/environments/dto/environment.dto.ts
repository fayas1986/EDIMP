import { createZodDto } from 'nestjs-zod/dto';
import { CreateEnvironmentSchema, UpdateEnvironmentSchema } from '@edimp/contracts';

export class CreateEnvironmentDto extends createZodDto(CreateEnvironmentSchema) {}
export class UpdateEnvironmentDto extends createZodDto(UpdateEnvironmentSchema) {}
