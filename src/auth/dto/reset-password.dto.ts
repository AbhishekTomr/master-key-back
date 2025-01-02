import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  new_password: string;
}
