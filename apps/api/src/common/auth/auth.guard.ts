import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtVerifierService } from './jwt-verifier.service';

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
    private jwtVerifier: JwtVerifierService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Bearer authorization token.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException('Empty Bearer authorization token.');
    }

    const payload = await this.jwtVerifier.verifyToken(token);
    const userEmail = payload.email || payload.upn || payload.sub;

    if (!userEmail) {
      throw new UnauthorizedException('JWT payload missing user email/subject claim.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { id: userEmail },
        ],
      },
      include: {
        tenantMembers: true,
        workspaceMembers: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(`User account '${userEmail}' is not registered in EDIMP.`);
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
