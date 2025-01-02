import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const typeOrmOptions: TypeOrmModuleOptions = {
      type: this.configService.get<any>('DB_TYPE'),
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      entities: [`dist/**/*.entity.js`],
      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: true, // Use true for stricter validation
              ca: readFileSync(
                join(__dirname, '../../db_ssl_certificate.pem'),
              ).toString(),
            }
          : false,
      synchronize: false,
    };
    return typeOrmOptions;
  }
}
