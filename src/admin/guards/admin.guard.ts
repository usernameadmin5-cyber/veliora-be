import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth: string | undefined = request.headers['authorization'];
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Admin token required');

    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.config.get<string>('ADMIN_JWT_SECRET') ??
          'admin-fallback-secret',
      });
      if (payload?.role !== 'admin') throw new UnauthorizedException();
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
