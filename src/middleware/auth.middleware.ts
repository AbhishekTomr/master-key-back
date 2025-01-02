import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtTokenService } from 'src/jwt_token/jwt_token.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly userService: UserService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies['tau'];
    if (!token) {
      throw new UnauthorizedException('User is not authenticated!');
    }
    try {
      const data = await this.jwtTokenService.getDataFromToken(token);
      if (!data['id']) {
        throw new UnauthorizedException('User is not authenticated!');
      }
      req['user'] = await this.userService.findById(data['id']);
      next();
    } catch (err) {
      throw err;
    }
  }
}
