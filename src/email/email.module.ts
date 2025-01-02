import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          //..config options
          transport: {
            host: configService.get<string>('EMAIL_HOST'),
            port: configService.get<number>('EMAIL_PORT'),
            secure: configService.get<boolean>('EMAIL_SECURE') === true,
            auth: {
              user: configService.get<string>('EMAIL_USERNAME'),
              pass: configService.get<string>('EMAIL_PASSWORD'),
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
