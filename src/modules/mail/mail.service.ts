import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserEmailPayload } from '../auth/types/auth.types';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user:User, otp: string) {
  await this.mailerService.sendMail({
    to: user.email,
    subject: 'Welcome to Nice App! Confirm your Email',
    html: `
      <p>Hey ${user.userName},</p>
      <p>Your verification code is:</p>
       <div style="font-size:24px; font-weight:bold; letter-spacing:4px;">
          ${otp}
       </div>
      <p>If you did not request this email you can safely ignore it.</p>
    `
  });
  console.log(`✅ Email sent successfully`);
  return true;
 }
  
  async sendPasswordResetEmail(user: UserEmailPayload, token: string) {
  const url = `http://localhost:3000/auth/reset-password?token=${token}`;

  await this.mailerService.sendMail({
    to: user.email,
    subject: 'Reset Your Password',
    html: `
      <p>Hi ${user.userName},</p>
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password:</p>

      <a href="${url}">
         Reset Password
      </a>

      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

}
