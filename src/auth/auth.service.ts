import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}
  async signUp(signUpDto: SignUpDto) {
    //fetch user details
    const { first_name, last_name, email, password } = signUpDto;
    try {
      const existingUser = await this.userRepository.find({
        where: { email },
      });
      if (existingUser.length) {
        throw new ConflictException('user already exist!!!');
      }
      const salt = await randomBytes(8).toString('hex');
      const hashedPass = (
        (await scrypt(password, salt, 32)) as Buffer
      ).toString('hex');
      const user = await this.userRepository.create({
        first_name,
        last_name,
        email,
        password: `${hashedPass}.${salt}`,
      });
      return this.userRepository.save(user);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password: pass } = loginDto;
      const user = await this.userRepository.findOneBy({
        email,
      });
      if (!user) {
        throw new NotFoundException('user not found');
      }
      const { password } = user;
      const [hash, salt] = password.split('.');
      const hashedPass = ((await scrypt(pass, salt, 32)) as Buffer).toString(
        'hex',
      );
      if (hashedPass !== hash) {
        throw new UnauthorizedException('Invalid Credentials');
      }
      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  logout() {
    return {
      status: true,
      message: 'Logged out successfully',
    };
  }
}
