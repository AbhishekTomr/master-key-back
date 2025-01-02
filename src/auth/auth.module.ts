import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtTokenModule } from 'src/jwt_token/jwt_token.module';
import { UserModule } from 'src/user/user.module';
import { EmailModule } from 'src/email/email.module';
import { GoogleStrategy } from './utils/google.strategy';
import { GoogleDriveServices } from './utils/google.drive.services';
import { HelpersService } from './utils/helpers.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, GoogleDriveServices, HelpersService],
  imports: [JwtTokenModule, UserModule, EmailModule],
  exports: [GoogleDriveServices],
})
export class AuthModule {}
