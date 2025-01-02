import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtTokenService } from 'src/jwt_token/jwt_token.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class VerificationMiddlware implements NestMiddleware {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly userService: UserService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies['verify'];
      if (!token) throw new BadRequestException('User Cannot be verified !!!');
      const data = this.jwtTokenService.getDataFromToken(token);
      const userId = data['userId'];
      const otp = data['otp'];
      if (!userId || !otp) {
        throw new UnauthorizedException('Invalid Otp !!!');
      }
      req['user'] = await this.userService.findById(data['userId']);
      req['otp'] = otp;
      next();
    } catch (err) {
      throw err;
    }
  }
}
