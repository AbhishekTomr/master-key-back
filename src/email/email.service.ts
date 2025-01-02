import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendEmail(to: string, subject: string, html: string | Buffer) {
    try {
      await this.mailerService.sendMail({
        to,
        from: 'demobolster@gmail.com',
        subject,
        html,
      });
      console.log('email sent successfully!!!');
    } catch (err) {
      console.log('error sending email', err);
    }
  }
}
