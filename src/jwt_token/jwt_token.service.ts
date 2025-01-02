import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

interface id {
  id: number;
}
@Injectable()
//needed only if u are going to inject any thing from di.
export class JwtTokenService {
  //todo set as env variables
  private readonly expiresIn = '1d';
  constructor(private readonly configService: ConfigService) {}
  async generateToken(data: Object): Promise<string> {
    return await jwt.sign(
      { ...data },
      this.configService.get<string>('APP_SECRET'),
      {
        expiresIn: this.expiresIn,
      },
    );
  }

  getDataFromToken(token: string): jwt.JwtPayload | string {
    return jwt.verify(token, this.configService.get<string>('APP_SECRET'));
  }
}
