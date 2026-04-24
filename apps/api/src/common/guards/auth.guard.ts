import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // For NextAuth integration, we'll validate the session
    // This is a simplified version - in production you'd want proper JWT validation
    const sessionHeader = request.headers.authorization;

    if (!sessionHeader) {
      throw new UnauthorizedException('No session provided');
    }

    // Extract userId from session (you'll need to implement proper session validation)
    const userId = request.headers['x-user-id'];

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
