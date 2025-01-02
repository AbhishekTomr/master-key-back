import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id: number;
  @Expose()
  first_name: string;
  @Expose()
  last_name: string;
  @Expose()
  email: string;
  @Expose()
  user_name: string;
  @Expose()
  profile_img: string;
}
