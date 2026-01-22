import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/common/types/declaration-mergin';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVariables>) => {
        return {
          transport: {
            host: configService.getOrThrow('MAIL_HOST'),
            port: configService.getOrThrow('MAIL_PORT'),
            secure: false,
            auth: {
              user: configService.getOrThrow('MAIL_USER'),
              pass: configService.getOrThrow('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: configService.getOrThrow('MAIL_FROM'),
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
