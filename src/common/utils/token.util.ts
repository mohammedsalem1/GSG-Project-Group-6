import crypto from 'crypto';

export const generateVerifyToken = (
  userId: string,
  email: string,
  minutesValid: number,
) => {
  const expires = Date.now() + minutesValid * 60 * 1000;
  const data = `${userId}.${email}.${expires}`;

  const signature = crypto
    .createHmac('sha256', process.env.EMAIL_SECRET!)
    .update(data)
    .digest('hex');

  return `${signature}.${expires}`;
};

export const verifyToken = (
  userId: string,
  email: string,
  token: string,
): boolean => {
  const [signature, expiresStr] = token.split('.');
  const expires = Number(expiresStr);
  console.log(signature);
  if (Date.now() > expires) {
    console.error('Token expired');
    return false;
  }

  const data = `${userId}.${email}.${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.EMAIL_SECRET!)
    .update(data)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
};
