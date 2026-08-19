import { createZodDto } from 'nestjs-zod/dto';
import { CreateTenantSchema, UpdateTenantSchema } from '@edimp/contracts';

export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}
export class UpdateTenantDto extends createZodDto(UpdateTenantSchema) {}
