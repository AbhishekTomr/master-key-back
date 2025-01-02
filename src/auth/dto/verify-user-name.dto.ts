import { IsString } from 'class-validator';

export class VerifyUserName {
  @IsString()
  user_name: string;
}
