import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class RequestUser {
  id: string;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const headerUserId = request.headers['x-user-id'] as string;
    let user = null;

    if (headerUserId) {
      user = await this.prisma.user.findUnique({ where: { id: headerUserId } });
    }

    if (!user) {
      user = await this.prisma.user.findFirst();
    }

    if (!user) {
      throw new UnauthorizedException('No user found in system.');
    }

    request.user = {
      id: user.id,
      email: user.email,
    };

    return true;
  }
}
