import { Injectable } from '@nestjs/common'
import { QueryFailedError, Repository } from 'typeorm'
import { Doctor } from '../@common/entities/doctor'
import { Role, RoleName } from '../@common/entities/role.entity'
import { User } from '../@common/entities/user.entity'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'

const PG_UNIQUE_VIOLATION = '23505'
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
  async createWithUser(input: DoctorCreateInput): Promise<Doctor> {
    try {
      return await this.manager.transaction(async (manager) => {
        const doctorRole = await manager.findOneOrFail(Role, {
          where: { name: RoleName.DOCTOR },
        })

        const user = await manager.save(
          manager.create(User, {
            name: input.name,
            email: input.email,
            passworHash: input.passwordHash,
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
    return this.findOne({
      where: { id },
      relations: {
        user: {
          roles: true,
        },
      },
    })
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
    const query = this.createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .orderBy('doctor.id', 'ASC')
      .skip((filter.page - 1) * filter.pageSize)
      .take(filter.pageSize)

    if (filter.name) {
      query.andWhere('user.name ILIKE :name', { name: `%${filter.name}%` })
    }

    return query.getManyAndCount()
  }

  private translateUniqueViolation(error: unknown): unknown {
    if (!(error instanceof QueryFailedError)) {
      return error
    }

    const driverError = error.driverError as {
      code?: string
      constraint?: string
    }

    if (driverError.code !== PG_UNIQUE_VIOLATION) {
      return error
    }

    if (driverError.constraint === 'uq_user_email') {
      return new DomainError(
        'E-mail já cadastrado.',
        ERROR_CODE.EMAIL_JA_CADASTRADO,
      )
    }

    if (driverError.constraint === 'uq_doctor_crm') {
      return new DomainError('CRM já cadastrado.', ERROR_CODE.CRM_JA_CADASTRADO)
    }

    return error
  }
}
