import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestUser } from '../auth/auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantWorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Unauthenticated user context.');
    }

    const tenantId = request.params?.tenantId || request.body?.tenantId || request.query?.tenantId || request.headers['x-tenant-id'];
    const workspaceId = request.params?.workspaceId || request.body?.workspaceId || request.query?.workspaceId || request.headers['x-workspace-id'];
    const environmentId = request.params?.environmentId || request.body?.environmentId || request.query?.environmentId || request.headers['x-environment-id'];

    const path = request.route?.path || '';
    let resolvedTenantId = tenantId;
    let resolvedWorkspaceId = workspaceId;

    if (request.params?.id) {
      if (path.includes('/tenants/:id')) {
        resolvedTenantId = request.params.id;
      } else if (path.includes('/workspaces/:id')) {
        resolvedWorkspaceId = request.params.id;
      }
    }

    if (resolvedTenantId) {
      if (!user.tenantIds || !user.tenantIds.includes(resolvedTenantId)) {
        throw new ForbiddenException(`Cross-tenant access denied: User '${user.email}' lacks access to Tenant '${resolvedTenantId}'.`);
      }
    }

    if (resolvedWorkspaceId) {
      if (!user.workspaceIds || !user.workspaceIds.includes(resolvedWorkspaceId)) {
        throw new ForbiddenException(`Cross-workspace access denied: User '${user.email}' lacks access to Workspace '${resolvedWorkspaceId}'.`);
      }
    }

    if (environmentId) {
      const env = await this.prisma.environment.findUnique({
        where: { id: environmentId },
        select: { workspaceId: true },
      });
      if (!env) {
        throw new ForbiddenException(`Environment '${environmentId}' not found.`);
      }
      if (!user.workspaceIds || !user.workspaceIds.includes(env.workspaceId)) {
        throw new ForbiddenException(`Cross-environment access denied: User '${user.email}' lacks access to Workspace '${env.workspaceId}' owning Environment '${environmentId}'.`);
      }
    }

    return true;
  }
}
