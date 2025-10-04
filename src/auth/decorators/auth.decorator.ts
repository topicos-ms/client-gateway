import { applyDecorators, UseGuards } from '@nestjs/common';
import { RoleProtected } from './role-protected.decorator';
import { ValidRoles } from '../interfaces';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const Auth = (...roles: ValidRoles[]) =>
  applyDecorators(RoleProtected(...roles), UseGuards(JwtAuthGuard));