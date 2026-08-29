import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtVerifierService } from './jwt-verifier.service';
import { AuthGuard } from './auth.guard';
import { TenantWorkspaceGuard } from '../guards/tenant.guard';
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { SecretsModule } from '../secrets/secrets.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, SecretsModule],
  providers: [JwtVerifierService, AuthGuard, TenantWorkspaceGuard, InternalServiceGuard],
  exports: [JwtVerifierService, AuthGuard, TenantWorkspaceGuard, InternalServiceGuard],
})
export class AuthModule {}
