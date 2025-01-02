import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  first_name: string;
  @Column()
  last_name: string;
  @Column()
  email: string;
  @Column()
  password: string;
  @Column()
  user_name: string;
  @Column({
    default: false,
  })
  verified: boolean;
  @Column({ default: '' })
  profile_img: string;
}
