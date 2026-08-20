import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtVerifierService } from './jwt-verifier.service';
import { AuthGuard } from './auth.guard';
import { TenantWorkspaceGuard } from '../guards/tenant.guard';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [JwtVerifierService, AuthGuard, TenantWorkspaceGuard],
  exports: [JwtVerifierService, AuthGuard, TenantWorkspaceGuard],
})
export class AuthModule {}
