import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async addUser(
    {
      first_name,
      last_name,
      password,
      email,
      user_name,
      profile_img,
    }: SignUpDto,
    verified: boolean = false,
  ) {
    const user = this.userRepository.create({
      first_name,
      last_name,
      password,
      email,
      user_name,
      verified,
      profile_img,
    });
    //row
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOneBy({ email: email });
  }

  async findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async findByProperty(property: string, value: any): Promise<UserEntity[]> {
    return this.userRepository.find({
      where: {
        [property]: value,
      },
    });
  }

  async updateUser(user: UserEntity) {
    return this.userRepository.save(user);
  }
}
