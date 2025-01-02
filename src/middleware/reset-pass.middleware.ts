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
export class ResetPasswordVerificationMiddlware implements NestMiddleware {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly userService: UserService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies['v_token'];
      if (!token) throw new BadRequestException('User Cannot be verified !!!');
      const data = this.jwtTokenService.getDataFromToken(token);
      const userId = data['userId'];
      if (!userId) {
        throw new UnauthorizedException('Invalid Otp !!!');
      }
      req['user'] = await this.userService.findById(userId);
      next();
    } catch (err) {
      throw err;
    }
  }
}
