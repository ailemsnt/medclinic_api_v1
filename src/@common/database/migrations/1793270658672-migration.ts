import { MigrationInterface, QueryRunner } from 'typeorm'
import { env } from '../../config/env.config'
import { hashPassword } from '../../utils/hash-password'
import { RoleName } from '../../entities/role'

export class Migration1793270658672 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Atualiza o admin criado pelo seed (o primeiro usuário com perfil admin)
    // com o nome, o e-mail e a senha das variáveis de ambiente atuais.
    const adminPasswordHash = await hashPassword(env.ADMIN_PASSWORD)

    await queryRunner.query(
      `UPDATE "user"
            SET "name" = $1, "email" = $2, "password_hash" = $3, "updated_at" = now()
            WHERE "id" = (
                SELECT MIN("user_roles_role"."user_id")
                FROM "user_roles_role"
                INNER JOIN "role" ON "role"."id" = "user_roles_role"."role_id"
                WHERE "role"."name" = $4
            )`,
      [
        env.ADMIN_NAME,
        env.ADMIN_EMAIL.toLowerCase(),
        adminPasswordHash,
        RoleName.ADMIN,
      ],
    )
  }

  public async down(): Promise<void> {
    return Promise.resolve()
  }
}
