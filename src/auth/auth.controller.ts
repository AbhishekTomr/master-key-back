import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
import { JwtTokenService } from 'src/jwt_token/jwt_token.service';
import { User } from 'src/decorators/user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from 'src/interceptors/serialize.interceptor';
import { Request, Response } from 'express';
import { VerifyUserName } from './dto/verify-user-name.dto';
import { GoogleStrategy } from './utils/google.strategy';
import { GoogleAuthGaurd } from './utils/google.auth.gaurd';
import _, { isEmpty } from 'lodash';
import { GoogleDriveServices } from './utils/google.drive.services';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import * as multer from 'multer';
import { ProfileDto } from './dto/profile.dto';
import { UserDto } from 'src/user/dtos/user.dto';
import { UpdatePassDto } from './dto/update-pass.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  //todo set as env variables

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtTokenService,
  ) {}

  @UseInterceptors(SerializeInterceptor)
  @Post('signup')
  async userSignUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  async userLogin(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.login(loginDto);
    const token = await this.jwtService.generateToken({ id: user.id });
    res.cookie('tau', token);
    return res.json({
      status: true,
      message: 'user logged in successfuly',
    });
  }

  @UseGuards(GoogleAuthGaurd)
  @Get('google/login')
  async googleLogin() {
    //empty method requires when ever user hits this route,
    //authGaurd will get activated and redirect the user to login page.
  }

  @UseGuards(GoogleAuthGaurd)
  @Get('google/redirect')
  async googleRedirect(@Req() req: Request, @Res() res: Response) {
    //user gets redirected to this method after successfull login.
    //setup the jwt token here and return the response
    const { user } = req;
    if (!user)
      return {
        status: false,
        message: 'user not found',
      };
    const token = await this.jwtService.generateToken({ id: user['id'] });
    res.cookie('tau', token);
    return res.redirect('http://localhost:3001/profile');
  }

  @Get('logout')
  userLogout(@User() user: UserEntity, @Res() res: Response) {
    return this.authService.logout(res);
  }

  @UseInterceptors(SerializeInterceptor)
  @Get('verify/:verificationToken')
  async verify(@Param('verificationToken') verificationToken: string) {
    return this.authService.verify(verificationToken);
  }

  @UseInterceptors(SerializeInterceptor)
  @Get('get-user-info')
  async getUserInfo(@User() user: UserEntity) {
    return this.authService.getUserInfo(user);
  }

  @Post('verify/username')
  async verifyUserName(@Body() { user_name }: VerifyUserName) {
    return this.authService.verifyUserName(user_name);
  }
  // @Post('upload')
  // async uploadImage(@Body('filePath') filePath: string) {
  //   const mimeType = 'image/jpeg'; // Adjust the MIME type based on your file
  //   try {
  //     const fileId = await this.googleDriveService.uploadFile(
  //       filePath,
  //       mimeType,
  //     );
  //     return { message: 'File uploaded successfully', fileId };
  //   } catch (error) {
  //     return { message: 'File upload failed', error: error.message };
  //   }
  // }

  @UseInterceptors(
    FileInterceptor('profile_img', {
      storage: multer.memoryStorage(),
    }),
  )
  @UseInterceptors(SerializeInterceptor)
  @Post('profile')
  async updateProfile(
    @User() user: UserEntity,
    @UploadedFile() profile_pic: Express.Multer.File,
    @Body() { user_name }: ProfileDto,
  ) {
    return this.authService.updateUserProfile(user, user_name, profile_pic);
  }

  @Post('update-password')
  async updatePassword(
    @Body() updatePassDto: UpdatePassDto,
    @User() user: UserEntity,
  ) {
    return this.authService.updatePassword(updatePassDto, user);
  }

  @Post('verify/email')
  async verifyEmail(
    @Body() { email }: EmailVerificationDto,
    @Res() res: Response,
  ) {
    const token = await this.authService.verifyEmail(email);
    if (!token) throw new BadRequestException('Something went wrong');
    res.cookie('verify', token);
    return res.json({
      status: true,
      message: 'Email verification link sent successfully',
    });
  }

  @Post('verify/otp')
  async verifyToken(
    @Body() verifyOtpDto: VerifyOtpDto,
    @User() user: UserEntity,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const otp = req['otp'];
    return this.authService.verifyToken(user, otp, verifyOtpDto, res);
  }

  @Post('verify/reset-password')
  async resetPassword(
    @Body() { new_password }: ResetPasswordDto,
    @User() user: UserEntity,
    @Res() res: Response,
  ) {
    return this.authService.resetPassword(new_password, user, res);
  }

  @Get('profile/img/:id')
  async getProfilePic(@Param('id') id: string, @Res() res: Response) {
    return this.authService.getProfilePic(id, res);
  }
}
