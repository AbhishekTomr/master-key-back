import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1735829323086 implements MigrationInterface {
    name = 'InitialMigration1735829323086'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "user_name" character varying NOT NULL, "verified" boolean NOT NULL DEFAULT false, "profile_img" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
