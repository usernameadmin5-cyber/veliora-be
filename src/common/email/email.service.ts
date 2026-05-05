import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(EmailService.name);
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(
    to: string,
    otp: string,
    context: 'signup' | 'forgot-password' | 'email-change',
  ): Promise<void> {
    const subject =
      context === 'signup'
        ? 'Veliora — Verify your email'
        : context === 'forgot-password'
          ? 'Veliora — Password reset code'
          : 'Veliora — Confirm your new email';

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7E6BB5">Your verification code</h2>
        <p style="font-size:2rem;letter-spacing:0.3em;font-weight:700;color:#5B4D8E">${otp}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#999;font-size:0.8rem">If you didn't request this, ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from:
          this.config.get<string>('SMTP_FROM') ??
          '"Veliora" <noreply@veliora.app>',
        to,
        subject,
        html,
      });
      this.logger.log('OTP email sent', { to, context });
    } catch (err) {
      this.logger.error('Failed to send OTP email', err, { to, context });
      throw err;
    }
  }
}
