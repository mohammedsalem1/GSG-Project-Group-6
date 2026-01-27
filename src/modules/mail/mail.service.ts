import { Injectable } from '@nestjs/common';
import { UserEmailPayload } from '../auth/types/auth.types';
import { EmailPurpose } from './enums/email-purpose.enum';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOtpEmail(
    user: UserEmailPayload,
    otp: string,
    purpose: EmailPurpose,
  ): Promise<void> {
    const template = this.getOtpTemplate(user, otp, purpose);

    await this.mailerService.sendMail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    console.log(`✅ ${purpose} email sent to ${user.email}`);
  }

  private getOtpTemplate(
    user: UserEmailPayload,
    otp: string,
    purpose: EmailPurpose,
  ): { subject: string; html: string } {
    switch (purpose) {
      case EmailPurpose.VERIFY_EMAIL:
        return {
          subject: 'Confirm your email',
          html: `
            <p>Hi ${user.userName},</p>
            <p>Your email verification code is:</p>
            <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">
              ${otp}
            </div>
            <p>This code will expire in 15 minutes.</p>
          `,
        };

      case EmailPurpose.RESET_PASSWORD:
        return {
          subject: 'Reset your password',
          html: `
            <p>Hi ${user.userName},</p>
            <p>You requested to reset your password.</p>
            <p>Your reset code is:</p>
            <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">
              ${otp}
            </div>
            <p>This code will expire in 15 minutes.</p>
          `,
        };

      default:
        throw new Error('Invalid email purpose');
    }
  }
}
