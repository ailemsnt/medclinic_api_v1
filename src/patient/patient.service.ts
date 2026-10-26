import { Patient } from './../@common/entities/patient'
import { Injectable } from '@nestjs/common'
import { PatientRepository } from './patient.repository'
import { PatientCreateDto } from './dto/patient-create.dto'
import { PatientResponseDto } from './dto/patient-response.dto'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { PatientListDto } from './dto/patient-list.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
import { PatientUpdateDto } from './dto/patient-update.dto'

@Injectable()
export class PatientService {
  constructor(private readonly patientRepository: PatientRepository) {}

  async create(dto: PatientCreateDto): Promise<PatientResponseDto> {
    const existsPatient = await this.patientRepository.findByCpf(dto.cpf)
    if (existsPatient) {
      throw new DomainError('CPF já cadastrado', ERROR_CODE.CPF_JA_CADASTRADO)
    }

    const patient = await this.patientRepository.createPatient({
      name: dto.name,
      cpf: dto.cpf,
    })

    return PatientResponseDto.resultEntity(patient)
  }

  async findAll(
    query: PatientListDto,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const [patients, total] = await this.patientRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      name: query.name,
    })

    return PaginatedResponseDto.create(
      patients.map((patient) => PatientResponseDto.resultEntity(patient)),
      total,
      query.page,
      query.pageSize,
    )
  }

  async findById(id: number): Promise<PatientResponseDto> {
    return PatientResponseDto.resultEntity(await this.getPatient(id))
  }

  async update(id: number, dto: PatientUpdateDto): Promise<PatientResponseDto> {
    const patient = await this.getPatient(id)
    if (dto.name !== undefined) {
      patient.name = dto.name
    }

    const updatePatient = await this.patientRepository.save(patient)
    return PatientResponseDto.resultEntity(updatePatient)
  }

  async remove(id: number): Promise<void> {
    await this.getPatient(id)
    await this.patientRepository.softDelete({ id })
  }

  private async getPatient(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findById(id)
    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    return patient
  }
}
