import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpersService {
  constructor() {}
  generateOtp(length: number) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10); // Generate random digits between 0-9
    }
    return otp;
  }
}
