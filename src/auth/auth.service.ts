import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';

import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { JwtTokenService } from 'src/jwt_token/jwt_token.service';
import { VerifyUserName } from './dto/verify-user-name.dto';
import { Profile } from 'passport';
import { isEmpty, isEqual } from 'lodash';
import { GoogleDriveServices } from './utils/google.drive.services';
import { UserEntity } from 'src/user/entities/user.entity';
import { UpdatePassDto } from './dto/update-pass.dto';
import { HelpersService } from './utils/helpers.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import axios from 'axios';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly googleDriveService: GoogleDriveServices,
    private readonly helperService: HelpersService,
  ) {}

  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async signUp(signUpDto: SignUpDto) {
    //fetch user details
    const { first_name, last_name, email, password, user_name } = signUpDto;
    try {
      const existingUserByEmail = await this.userService.findByEmail(email);
      const existingUserByUserName = await this.userService.findByProperty(
        'user_name',
        user_name,
      );
      if (existingUserByEmail) {
        throw new ConflictException('user with this email already exist!!!');
      }
      if (existingUserByUserName.length) {
        throw new ConflictException('user_name already taken!!!');
      }
      const salt = await randomBytes(8).toString('hex');
      const hashedPass = (
        (await scrypt(password, salt, 32)) as Buffer
      ).toString('hex');
      const user = await this.userService.addUser({
        first_name,
        last_name,
        email,
        password: `${hashedPass}.${salt}`,
        user_name,
      });
      const verificationToken = await this.jwtTokenService.generateToken({
        id: user.id,
      });
      await this.sendVerficationMail(
        `${user.first_name + ' ' + user.last_name}`,
        user.email,
        verificationToken,
      );
      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async verifyPassword(pass: string, userPass: string): Promise<boolean> {
    const [hash, salt] = userPass.split('.');
    const hashedPass = ((await scrypt(pass, salt, 32)) as Buffer).toString(
      'hex',
    );
    if (hashedPass !== hash) {
      return false;
    }
    return true;
  }

  async login(loginDto: LoginDto) {
    try {
      const { identifier, password: pass } = loginDto;
      const IsEmail = this.isEmailValid(identifier);
      const user = (
        await this.userService.findByProperty(
          IsEmail ? 'email' : 'user_name',
          identifier,
        )
      ).pop();
      if (!user) {
        throw new NotFoundException('user not found');
      }
      if (!user.verified) throw new ForbiddenException('user not verified!');
      const { password } = user;
      const matched = await this.verifyPassword(pass, password);
      if (!matched) {
        throw new UnauthorizedException('Invalid Credentials');
      }
      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async sendVerficationMail(
    name: string,
    email: string,
    verificationToken: string,
  ) {
    const subject = 'User verfication';
    const body = `<h2>Hello ${name}</h2>
    <p>This is a verification mail. Please verify your account with the by clicking on the link below</p>
    <a href='http://localhost:3000/auth/verify/${verificationToken}'>Verify Me<a>`;
    await this.emailService.sendEmail(email, subject, body);
  }

  async logout(res: Response) {
    try {
      res.clearCookie('tau');
      return res.json({
        status: true,
        message: 'logged out successfully',
      });
    } catch (err) {
      throw err;
    }
  }

  async verify(verificationToken: string) {
    try {
      const token =
        await this.jwtTokenService.getDataFromToken(verificationToken);
      if (!token['id']) {
        throw new UnauthorizedException('invalid verification token!');
      }
      const userId = token['id'];
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new NotFoundException('user cannot be verified!');
      }
      if (user.verified) {
        return {
          status: true,
          message: 'user already verified',
        };
      }
      user.verified = true;
      return this.userService.updateUser(user);
    } catch (err) {
      throw err;
    }
  }

  async verifyUserName(user_name: string) {
    const user = await this.userService.findByProperty('user_name', user_name);
    if (user.length)
      return { status: false, message: 'username already taken !!' };
    return { status: true, message: 'username available !!' };
  }

  async validateOAuthUser(profile: Profile) {
    //validate if the user exist
    //create a user if not.
    const { value: email } = profile.emails.pop();
    const { value: profile_img } = profile.photos.pop();
    const user = await this.userService.findByProperty('email', email);
    if (!isEmpty(user)) return user.pop();
    const { givenName: first_name, familyName: last_name } = profile.name;
    //create a random pass.
    const randompass = await this.jwtTokenService.generateToken(Date.now());
    //create a random username.
    const user_name = `${first_name}_${Date.now()}`;
    const newUser = await this.userService.addUser(
      {
        first_name,
        last_name,
        email,
        password: randompass,
        user_name,
        profile_img,
      },
      true,
    );
    return newUser;
  }

  async updateUserProfile(
    user: UserEntity,
    user_name: string,
    profile_img: Express.Multer.File,
  ) {
    //get the user via user_name;
    if (!user) throw new NotFoundException('User not found');
    //update the user name
    !isEqual(user_name, user.user_name);
    {
      user.user_name = user_name;
    }
    if (profile_img) {
      if (
        user.profile_img.length &&
        !user.profile_img.toString().includes('usercontent')
      ) {
        //delete the existing profile pic;
        //if its not pointing to your google profile pic
        const { status, message } = await this.googleDriveService.deleteFile(
          user.profile_img,
        );
        if (!status)
          throw new BadRequestException('unable to update user, try again');
      }
      const { publicUrl } =
        await this.googleDriveService.uploadFile(profile_img);
      user.profile_img = publicUrl;
    }
    return this.userService.updateUser(user);
  }

  async getUserInfo(user: UserEntity) {
    const { profile_img } = user;
    let id = '';
    if (profile_img.length) {
      const urlObj = new URL(profile_img);
      id = urlObj.searchParams.get('id');
    }
    return { ...user, profile_img: id };
  }

  async updatePassword(
    updatePasswordDto: UpdatePassDto,
    user: UserEntity,
    skipVerification = false,
  ): Promise<UserEntity> {
    const { current_password, updated_password } = updatePasswordDto;
    const matched = await this.verifyPassword(current_password, user.password);
    if (!matched && !skipVerification) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    const salt = await randomBytes(8).toString('hex');
    const hashedPass = (
      (await scrypt(updated_password, salt, 32)) as Buffer
    ).toString('hex');
    return this.userService.updateUser({
      ...user,
      password: `${hashedPass}.${salt}`,
    });
  }

  async verifyEmail(email: string): Promise<string> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email Not Found!!!');
    }
    const otp = this.helperService.generateOtp(6);
    const body = `<div><h3>Hello ${user.first_name}</h3></br><p>use this otp to reset your password: ${otp}<p></div>`;
    await this.emailService.sendEmail(user.email, 'Reset Password OTP', body);
    const verificationToken = await this.jwtTokenService.generateToken({
      userId: user.id,
      otp: otp,
    });
    return verificationToken;
  }

  async verifyToken(
    user: UserEntity,
    otp: string,
    verifyOtpDto: VerifyOtpDto,
    res: Response,
  ) {
    const { email, otp: UserOtp } = verifyOtpDto;
    if (!user || !otp || user.email !== email)
      throw new UnauthorizedException('User Not Authorized to update password');
    if (UserOtp !== otp) throw new UnauthorizedException('Invalid OTP');
    res.clearCookie('verify');
    const passCookie = await this.jwtTokenService.generateToken({
      userId: user.id,
    });
    res.cookie('v_token', passCookie);
    return res.json({ message: 'OTP Verified Successfully' });
  }

  async resetPassword(new_password: string, user: UserEntity, res: Response) {
    if (!user) throw new UnauthorizedException('User not found');
    await this.updatePassword(
      { current_password: user.password, updated_password: new_password },
      user,
      true,
    );
    res.clearCookie('v_token');
    return res.json({ status: true, message: 'password updated successfully' });
  }

  async getProfilePic(id: string, res: Response) {
    const imageUrl = `https://drive.google.com/uc?export=view&id=${id}`;
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });
      res.set('Content-Type', 'image/jpeg'); // Adjust based on your image type
      res.send(response.data);
    } catch (err) {
      res.status(500).send('Error fetching image');
    }
    // return this.googleDriveService.getImageFromFileId(id);
  }
}
