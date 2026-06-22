import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
import { env } from '../../config/env.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const sessionHeader = request.headers.authorization;

    if (!sessionHeader) {
      throw new UnauthorizedException('No session provided');
    }

    const userId = request.headers['x-user-id'];

    if (!env.apiInternalSecret || request.headers['x-api-internal-secret'] !== env.apiInternalSecret) {
      throw new UnauthorizedException('Invalid API proxy credential');
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId as string }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    return true;
  }
}
