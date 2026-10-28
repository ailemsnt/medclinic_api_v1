import { Injectable } from '@nestjs/common'
import { AuthUserDto } from '../@common/dto/auth-user.dto'
import { RoleName } from '../@common/entities/role'
import { MedicalRecordRepository } from './medical-record.repository'
import { AppointmentRepository } from '../appointment/appointment.repository'
import { DoctorRepository } from '../doctor/doctor.repository'
import { MedicalRecordCreateDto } from './dto/medical-record-create.dto'
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { PaginationQueryDto } from '../@common/dto/pagination-query.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'

@Injectable()
export class MedicalRecordService {
  constructor(
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  async create(
    patientId: number,
    dto: MedicalRecordCreateDto,
    user: AuthUserDto,
  ): Promise<MedicalRecordResponseDto> {
    await this.ensurePatientExists(patientId)

    const linkedDoctorId = await this.getLinkedDoctorId(patientId, user)
    if (linkedDoctorId === null) {
      throw new DomainError(
        'Médico sem vínculo com o paciente.',
        ERROR_CODE.ACESSO_NEGADO,
      )
    }

    const medicalRecord =
      await this.medicalRecordRepository.createMedicalRecord({
        patientId,
        doctorId: linkedDoctorId,
        text: dto.text,
      })

    return MedicalRecordResponseDto.resultEntity(medicalRecord)
  }

  async findByPatient(
    patientId: number,
    query: PaginationQueryDto,
    user: AuthUserDto,
  ): Promise<PaginatedResponseDto<MedicalRecordResponseDto>> {
    await this.ensurePatientExists(patientId)

    const isAdmin = (user.data.roles ?? []).includes(RoleName.ADMIN)
    if (!isAdmin) {
      const linkedDoctorId = await this.getLinkedDoctorId(patientId, user)
      if (linkedDoctorId === null) {
        throw new DomainError(
          'Médico sem vínculo com o paciente.',
          ERROR_CODE.ACESSO_NEGADO,
        )
      }
    }

    const [medicalRecords, total] =
      await this.medicalRecordRepository.findByPatient({
        patientId,
        page: query.page,
        pageSize: query.pageSize,
      })

    return PaginatedResponseDto.create(
      medicalRecords.map((medicalRecord) =>
        MedicalRecordResponseDto.resultEntity(medicalRecord),
      ),
      total,
      query.page,
      query.pageSize,
    )
  }

  private async getLinkedDoctorId(
    patientId: number,
    user: AuthUserDto,
  ): Promise<number | null> {
    if (!(user.data.roles ?? []).includes(RoleName.DOCTOR)) {
      return null
    }

    const doctor = await this.doctorRepository.findByUserId(Number(user.sub))
    if (!doctor) {
      return null
    }

    const hasLink = await this.appointmentRepository.hasClinicalLink(
      doctor.id,
      patientId,
    )
    return hasLink ? doctor.id : null
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    const exists = await this.medicalRecordRepository.patientExists(patientId)
    if (!exists) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
  }
}
