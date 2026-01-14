import { User } from "@prisma/client";

export type UserEmailPayload  = Pick<User , 'id' | 'email' | 'userName'>