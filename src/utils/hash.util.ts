import * as bcrypt from 'bcrypt';

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Hash OTP code
 */
export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
}

/**
 * Compare plain OTP with hashed OTP
 */
export async function compareOTP(
  plainOTP: string,
  hashedOTP: string,
): Promise<boolean> {
  return bcrypt.compare(plainOTP, hashedOTP);
}
