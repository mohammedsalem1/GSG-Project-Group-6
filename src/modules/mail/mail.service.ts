import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User, otp: string) {
    // const url = `http://localhost:3000/auth/confirm?token=${token}&email=${user.email}`;
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
    `,
    });
    console.log(`✅ Email sent successfully`);
    return true;
  }
}
