import { MigrationInterface, QueryRunner } from 'typeorm'
import { RoleName } from '../../entities/role'
import { env } from '../../config/env.config'
import { hashPassword } from '../../utils/hash-password'

export class Migration1793065747446 implements MigrationInterface {
  name = 'Migration1793065747446'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD "doctor_id" integer NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP CONSTRAINT "fk_medical_record_patient_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP CONSTRAINT "rel_medical_record_patient_id"`,
    )
    await queryRunner.query(
      `CREATE INDEX "idx_medical_record_created_at_patient_id" ON "medical_record"  ("patient_id", "created_at") `,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD CONSTRAINT "fk_medical_record_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD CONSTRAINT "fk_medical_record_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )

    // Seed: perfis do sistema
    for (const roleName of [
      RoleName.ADMIN,
      RoleName.SECRETARY,
      RoleName.DOCTOR,
    ]) {
      await queryRunner.query(
        `INSERT INTO "role" ("name") SELECT $1::varchar WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE "name" = $1::varchar)`,
        [roleName],
      )
    }

    // Seed: administrador inicial (dados do .env)
    const adminEmail = env.ADMIN_EMAIL.toLowerCase()
    const adminPasswordHash = await hashPassword(env.ADMIN_PASSWORD)

    await queryRunner.query(
      `INSERT INTO "user" ("name", "email", "password_hash") VALUES ($1, $2, $3) ON CONFLICT ("email") DO NOTHING`,
      [env.ADMIN_NAME, adminEmail, adminPasswordHash],
    )

    await queryRunner.query(
      `INSERT INTO "user_roles_role" ("user_id", "role_id")
       SELECT "user"."id", "role"."id" FROM "user", "role"
       WHERE "user"."email" = $1 AND "role"."name" = $2
       ON CONFLICT DO NOTHING`,
      [adminEmail, RoleName.ADMIN],
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "user" WHERE "email" = $1`, [
      env.ADMIN_EMAIL.toLowerCase(),
    ])
    await queryRunner.query(`DELETE FROM "role" WHERE "name" IN ($1, $2, $3)`, [
      RoleName.ADMIN,
      RoleName.SECRETARY,
      RoleName.DOCTOR,
    ])
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP CONSTRAINT "fk_medical_record_doctor_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP CONSTRAINT "fk_medical_record_patient_id"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."idx_medical_record_created_at_patient_id"`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD CONSTRAINT "rel_medical_record_patient_id" UNIQUE ("patient_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" ADD CONSTRAINT "fk_medical_record_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP COLUMN "created_at"`,
    )
    await queryRunner.query(
      `ALTER TABLE "medical_record" DROP COLUMN "doctor_id"`,
    )
  }
}
