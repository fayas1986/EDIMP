import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtVerifierService } from './jwt-verifier.service';
import { ConfigService } from '@nestjs/config';

export class RequestUser {
  id: string;
  email: string;
  tenantIds: string[];
  workspaceIds: string[];
  roles: string[];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtVerifier: JwtVerifierService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string;
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const isProd = nodeEnv === 'production';

    // Verify that no x-user-id header bypass remains active in production
    if (isProd && request.headers['x-user-id']) {
      throw new UnauthorizedException('x-user-id header authentication is prohibited in production.');
    }

    // Allow dev/test fallback to x-user-id if Bearer token is missing (preserves historical test compatibility)
    if (!isProd && !authHeader) {
      const userId = request.headers['x-user-id'] as string;
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            tenantMembers: true,
            workspaceMembers: true,
          },
        });
        if (!user) {
          throw new UnauthorizedException(`User not registered in EDIMP.`);
        }
        if (user.deletedAt) {
          throw new UnauthorizedException('User account has been deactivated.');
        }
        request.user = {
          id: user.id,
          email: user.email,
          tenantIds: user.tenantMembers.map(tm => tm.tenantId),
          workspaceIds: user.workspaceMembers.map(wm => wm.workspaceId),
          roles: user.tenantMembers.map(tm => tm.role),
        };
        return true;
      }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Bearer authorization token.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException('Empty Bearer authorization token.');
    }

    const payload = await this.jwtVerifier.verifyToken(token);

    let user = null;
    if (isProd) {
      const oid = payload.oid;
      if (!oid) {
        throw new UnauthorizedException('OIDC token missing required oid claim.');
      }
      user = await this.prisma.user.findUnique({
        where: { externalIdentityId: oid },
        include: {
          tenantMembers: true,
          workspaceMembers: true,
        },
      });
    } else {
      // Non-production fallback (support oid, email, or id lookup for test compatibility)
      const lookupKey = payload.oid || payload.email || payload.upn || payload.sub;
      if (!lookupKey) {
        throw new UnauthorizedException('JWT payload missing user identifier claim.');
      }
      user = await this.prisma.user.findUnique({
        where: payload.oid 
          ? { externalIdentityId: payload.oid } 
          : (payload.email || payload.upn ? { email: lookupKey } : { id: lookupKey }),
        include: {
          tenantMembers: true,
          workspaceMembers: true,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException(`User not registered in EDIMP.`);
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account has been deactivated.');
    }

    request.user = {
      id: user.id,
      email: user.email,
      tenantIds: user.tenantMembers.map(tm => tm.tenantId),
      workspaceIds: user.workspaceMembers.map(wm => wm.workspaceId),
      roles: user.tenantMembers.map(tm => tm.role),
    };

    return true;
  }
}
