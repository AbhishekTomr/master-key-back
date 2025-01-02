import { Module } from '@nestjs/common';
import { JwtTokenService } from './jwt_token.service';

@Module({
  providers: [JwtTokenService],
  imports: [],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
