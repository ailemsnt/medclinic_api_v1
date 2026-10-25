import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1792960605963 implements MigrationInterface {
  name = 'Migration1792960605963'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_patient_cpf_deleted_at_is_null" ON "patient"  ("cpf") WHERE "deleted_at" IS NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_patient_cpf_deleted_at_is_null"`,
    )
  }
}
