import { Injectable } from '@nestjs/common'
import { User } from '../@common/entities/user'
import { Repository } from 'typeorm'
import { Role } from '../@common/entities/role'
import { isUniqueViolation } from '../@common/database/unique-violation'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'

export interface UserCreateInput {
  name: string
  email: string
  passwordHash: string
  roles: Role[]
}
@Injectable()
export class UserRepository extends Repository<User> {
  async getUserByEmail(email: string): Promise<User | null> {
    return this.findOne({
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        roles: true,
      },
      where: { email },
      relations: { roles: true },
    })
  }

  async get(id: number): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: { roles: true },
    })
  }

  async register(input: UserCreateInput): Promise<User> {
    try {
      return await this.save(this.create(input))
    } catch (error) {
      if (isUniqueViolation(error, 'uq_user_email')) {
        throw new DomainError(
          'E-mail já cadastrado.',
          ERROR_CODE.EMAIL_JA_CADASTRADO,
        )
      }
      throw error
    }
  }
}
