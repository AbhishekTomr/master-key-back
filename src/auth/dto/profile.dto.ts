import { IsString } from 'class-validator';
import { isBuffer } from 'lodash';

export class ProfileDto {
  @IsString()
  user_name: string;
}
