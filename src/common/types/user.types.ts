import { Role } from '@prisma/client';

// Re-export Prisma enums for type safety
export { Role, Availability, SkillLevel } from '@prisma/client';

// User type without sensitive fields
export interface SafeUser {
  id: string;
  userName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  image?: string | null;
}

// User in JWT payload
export interface RequestUser {
  id: string;
  userName: string;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
}
