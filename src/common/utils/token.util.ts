
import crypto from 'crypto';
// this Token save in database 
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex'); 
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

