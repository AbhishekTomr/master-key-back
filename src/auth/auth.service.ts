import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  signUp(signUpDto: SignUpDto) {
    return {
      status: true,
      message: 'User created successfully',
    };
  }

  login(loginDto: LoginDto) {
    return {
      status: true,
      message: 'User Loggedin successfully',
    };
  }

  logout() {
    return {
      status: true,
      message: 'Logged out successfully',
    };
  }
}
