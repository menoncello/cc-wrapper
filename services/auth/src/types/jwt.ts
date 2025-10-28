import type { UserRole } from '@cc-wrapper/shared-types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}
