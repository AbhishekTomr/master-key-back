import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePassDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @IsNotEmpty()
  updated_password: string;
}
