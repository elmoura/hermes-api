import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/config';
import { Md5HashService } from './md5-hash.service';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;

  constructor(private readonly md5HashService: Md5HashService) {
    this.transporter = this.createTransporter();
  }

  async sendSetPasswordEmail(
    to: string,
    firstName: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const signedPayload = `${config.security.confirmAccountHashSecret}${userId}:${organizationId}`;
    const signature = this.md5HashService.encrypt(signedPayload);
    const hash = `${userId}.${organizationId}.${signature}`;
    const setupLink = `${config.mail.frontendUrl}/set-password?hash=${encodeURIComponent(hash)}`;

    await this.transporter.sendMail({
      from: config.mail.from,
      to,
      subject: 'Defina sua senha',
      text: `Olá ${firstName}, acesse ${setupLink} para definir sua senha.`,
    });
  }

  async sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.mail.from,
      to,
      subject: 'Convite para a organização',
      text: `Você foi convidado. Acesse ${inviteUrl} para definir sua senha e ativar o acesso. O link expira em breve.`,
    });
  }

  private createTransporter(): Transporter {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }
}
