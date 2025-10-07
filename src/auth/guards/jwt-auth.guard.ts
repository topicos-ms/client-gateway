import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { ROLES_KEY } from '../decorators/role-protected.decorator';
import { ValidRoles } from '../interfaces';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    const validation = await this.authService.validateToken(token).catch(() => {
      throw new UnauthorizedException('Token is invalid or expired');
    });

    const user = validation.user;
    request['user'] = user;
    request['token'] = token;
    request['authValidation'] = validation;

    const requiredRoles =
      this.reflector.get<ValidRoles[]>(ROLES_KEY, context.getHandler()) || [];

    if (requiredRoles.length && !requiredRoles.includes(ValidRoles.ANY)) {
      const normalizedRequired = requiredRoles.map((role) => role.toUpperCase());
      const normalizedUserRoles = new Set<string>();

      if (typeof user.role === 'string') {
        normalizedUserRoles.add(user.role.toUpperCase());
      }

      if (Array.isArray(user.roles)) {
        for (const role of user.roles) {
          if (typeof role === 'string') {
            normalizedUserRoles.add(role.toUpperCase());
          }
        }
      }

      const hasRequiredRole = normalizedRequired.some((role) =>
        normalizedUserRoles.has(role),
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}