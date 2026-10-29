import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { MedicalRecord } from '../@common/entities/medical-record'
import { Patient } from '../patient/patient.entity'

export interface MedicalRecordCreateInput {
  patientId: number
  doctorId: number
  text: string
}

export interface MedicalRecordFindFilter {
  patientId: number
  page: number
  pageSize: number
}

@Injectable()
export class MedicalRecordRepository extends Repository<MedicalRecord> {
  async patientExists(patientId: number): Promise<boolean> {
    return this.manager.getRepository(Patient).existsBy({ id: patientId })
  }
  async createMedicalRecord(
    input: MedicalRecordCreateInput,
  ): Promise<MedicalRecord> {
    return this.save(this.create(input))
  }

  async findByPatient(
    filter: MedicalRecordFindFilter,
  ): Promise<[MedicalRecord[], number]> {
    return this.findAndCount({
      where: { patientId: filter.patientId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    })
  }
}
