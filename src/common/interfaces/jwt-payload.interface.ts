import { Role } from 'src/common/types/user.types';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  userName: string;
  role: Role;
  iat?: number; // Issued at
  exp?: number; // Expires at
}
