import { Injectable } from '@nestjs/common'
import { Patient } from './patient.entity'
import { ILike, Repository } from 'typeorm'
import { isUniqueViolation } from '../@common/database/unique-violation'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
export interface PatientCreateInput {
  name: string
  cpf: string
}

export interface PatientFindFilter {
  page: number
  pageSize: number
  name?: string
}

@Injectable()
export class PatientRepository extends Repository<Patient> {
  async createPatient(input: PatientCreateInput): Promise<Patient> {
    try {
      return await this.save(this.create(input))
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          'CPF já cadastrado.',
          ERROR_CODE.CPF_JA_CADASTRADO,
        )
      }
      throw error
    }
  }

  async findById(id: number): Promise<Patient | null> {
    return this.findOne({ where: { id } })
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    return this.findOne({ where: { cpf } })
  }

  async findAll(filter: PatientFindFilter): Promise<[Patient[], number]> {
    return this.findAndCount({
      where: filter.name ? { name: ILike(`%${filter.name}%`) } : {},
      order: { id: 'ASC' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    })
  }
}
