import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../../modules/auth/auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) {
      throw new Error('CurrentUser used on a non-authenticated route');
    }
    return request.user;
  },
);
