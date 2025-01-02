import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/entities/user.entity';
import { JwtTokenService } from './jwt_token/jwt_token.service';
import { JwtTokenModule } from './jwt_token/jwt_token.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { VerificationMiddlware } from './middleware/verification.middleware';
import { ResetPasswordVerificationMiddlware } from './middleware/reset-pass.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmConfigService } from './config/typeorm.config';

@Module({
  imports: [
    JwtTokenModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtTokenService],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/signup',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/google/login',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/google/redirect',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/verify/:verificationToken',
          method: RequestMethod.GET,
        },
        {
          path: 'auth/verify/username',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify/email',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify/otp',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/verify/reset-password',
          method: RequestMethod.POST,
        },
      )
      .forRoutes('*');
    consumer.apply(VerificationMiddlware).forRoutes({
      path: 'auth/verify/otp',
      method: RequestMethod.POST,
    });
    consumer.apply(ResetPasswordVerificationMiddlware).forRoutes({
      path: 'auth/verify/reset-password',
      method: RequestMethod.POST,
    });
  }
}
