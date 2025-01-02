import { DataSource, DataSourceOptions } from 'typeorm';
import _ from 'lodash';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: [`dist/**/*.entity.js`],
  migrations: [`dist/database/migrations/*.js`],
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: true, // Use true for stricter validation
          ca: readFileSync(
            join(__dirname, '../../db_ssl_certificate.pem'),
          ).toString(),
        }
      : false,
};

export const appDataSource = new DataSource(dataSourceOptions);
