import { Prisma } from "@prisma/client";

export type UserBadgeWithBadge = Prisma.UserBadgeGetPayload<{
  include: { badge: true }
}>;