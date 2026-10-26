import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1793016711609 implements MigrationInterface {
  name = 'Migration1793016711609'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "date"`)
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "duration"`)
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP COLUMN "patient_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "patient_id" integer NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "doctor_id"`)
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "doctor_id" integer NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "doctor_id"`)
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "doctor_id" bigint NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" DROP COLUMN "patient_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "patient_id" bigint NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "ends_at"`)
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "starts_at"`)
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "duration" integer NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "appointment" ADD "date" TIMESTAMP WITH TIME ZONE NOT NULL`,
    )
  }
}
