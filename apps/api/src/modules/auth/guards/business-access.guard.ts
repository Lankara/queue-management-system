import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BUSINESS_PARAM_KEY } from '../decorators/business-param.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const businessParam = this.reflector.getAllAndOverride<string>(BUSINESS_PARAM_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!businessParam) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ params: Record<string, string>; user?: AuthenticatedUser }>();
    const businessId = request.params[businessParam];

    if (!businessId) {
      return true;
    }

    const user = request.user;

    if (user?.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    if (user?.businessIds.includes(businessId)) {
      return true;
    }

    throw new ForbiddenException('You do not have access to this business');
  }
}
