export type EnvVariables = {
  JWT_SECRET: string;
  JWT_EXPIRES_IN:string
  JWT_REFRESH_SECRET:string;
  JWT_REFRESH_EXPIRES_IN:string;
  MAIL_HOST:string;
  MAIL_PORT:string;
  MAIL_USER:string;
  MAIL_PASSWORD:string;
  MAIL_FROM:string
  OTP_EXPIRES_IN:string
  NODE_ENV: 'development' | 'production';
};

declare global {
    namespace NodeJS {
       interface ProcessEnv extends EnvVariables {}
    }
}
