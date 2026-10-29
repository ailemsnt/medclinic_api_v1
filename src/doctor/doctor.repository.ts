import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Role, RoleName } from '../@common/entities/role'
import { User } from '../@common/entities/user'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { isUniqueViolation } from '../@common/database/unique-violation'
import { Doctor } from './doctor.entity'
export interface DoctorCreateInput {
  name: string
  email: string
  passwordHash: string
  crm: string
}

export interface DoctorFindFilter {
  page: number
  pageSize: number
  name?: string
}
@Injectable()
export class DoctorRepository extends Repository<Doctor> {
  async createDoctorWithUser(input: DoctorCreateInput): Promise<Doctor> {
    try {
      return await this.manager.transaction(async (manager) => {
        const doctorRole = await manager.findOneOrFail(Role, {
          where: { name: RoleName.DOCTOR },
        })

        const user = await manager.save(
          manager.create(User, {
            name: input.name,
            email: input.email,
            passwordHash: input.passwordHash,
            roles: [doctorRole],
          }),
        )

        return manager.save(
          manager.create(Doctor, {
            crm: input.crm,
            userId: user.id,
            user,
          }),
        )
      })
    } catch (error) {
      throw this.translateUniqueViolation(error)
    }
  }

  async findById(id: number): Promise<Doctor | null> {
    return this.activeDoctorQuery().andWhere('doctor.id = :id', { id }).getOne()
  }

  async findByUserId(userId: number): Promise<Doctor | null> {
    return this.activeDoctorQuery()
      .andWhere('doctor.userId = :userId', { userId })
      .getOne()
  }

  async findByCrm(crm: string): Promise<Doctor | null> {
    return this.findOne({
      where: { crm },
      relations: {
        user: {
          roles: false,
        },
      },
    })
  }

  async findAll(filter: DoctorFindFilter): Promise<[Doctor[], number]> {
    const query = this.activeDoctorQuery()
      .orderBy('doctor.id', 'ASC')
      .skip((filter.page - 1) * filter.pageSize)
      .take(filter.pageSize)

    if (filter.name) {
      query.andWhere('user.name ILIKE :name', { name: `%${filter.name}%` })
    }

    return query.getManyAndCount()
  }

  /** Médico ativo: o usuário dele não tem soft delete. */
  private activeDoctorQuery() {
    return this.createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.deletedAt IS NULL')
  }

  private translateUniqueViolation(error: unknown): unknown {
    if (isUniqueViolation(error, 'uq_user_email')) {
      return new DomainError(
        'E-mail já cadastrado.',
        ERROR_CODE.EMAIL_JA_CADASTRADO,
      )
    }

    if (isUniqueViolation(error, 'uq_doctor_crm')) {
      return new DomainError('CRM já cadastrado.', ERROR_CODE.CRM_JA_CADASTRADO)
    }

    return error
  }
}
