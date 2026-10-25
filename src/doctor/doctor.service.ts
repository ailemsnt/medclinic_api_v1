import { Injectable } from '@nestjs/common'
import { CreateWorkScheduleDto } from './dto/work-schedule-create.dto'
import { toAbsoluteDayMinutes } from './utils/utils'
import { WorkScheduleRepository } from './work-schedule.repository'
import { WorkScheduleConfiguration } from '../@common/entities/work-schedule'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { DoctorCreateDto } from './dto/doctor-create.dto'
import { DoctorResponseDto } from './dto/doctor-response'
import { UserService } from '../user/user.service'
import { DoctorRepository } from './doctor.repository'
import { hashPassword } from '../@common/utils/hash-password'
import { DoctorListDto } from './dto/doctor-list.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userService: UserService,
    private readonly workScheduleRepository: WorkScheduleRepository,
  ) {}

  async create(dto: DoctorCreateDto): Promise<DoctorResponseDto> {
    const existsUser = await this.userService.getUserByEmail(dto.email)
    if (existsUser) {
      throw new DomainError(
        'E-mail já cadastrado',
        ERROR_CODE.EMAIL_JA_CADASTRADO,
      )
    }

    const existsDoctor = await this.doctorRepository.findByCrm(dto.crm)
    if (existsDoctor) {
      throw new DomainError('CRM já cadastrado', ERROR_CODE.CRM_JA_CADASTRADO)
    }

    const doctor = await this.doctorRepository.createWithUser({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      crm: dto.crm,
    })

    return DoctorResponseDto.resultEntity(doctor)
  }

  async findById(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findById(id)
    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
    return DoctorResponseDto.resultEntity(doctor)
  }

  async findByCrm(crm: string): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findByCrm(crm)
    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
    return DoctorResponseDto.resultEntity(doctor)
  }

  async findAll(
    query: DoctorListDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const [doctors, total] = await this.doctorRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      name: query.name,
    })

    return PaginatedResponseDto.create(
      doctors.map((doctor) => DoctorResponseDto.resultEntity(doctor)),
      total,
      query.page,
      query.pageSize,
    )
  }

  private validateShifts(workSchedule: CreateWorkScheduleDto[]) {
    for (const workScheduleItem of workSchedule) {
      workScheduleItem.shifts.sort((a, b) => {
        const aDayMinutes = toAbsoluteDayMinutes(a.startTime)

        const bDayMinutes = toAbsoluteDayMinutes(b.startTime)

        return aDayMinutes - bDayMinutes
      })

      workScheduleItem.shifts.forEach((shift, index) => {
        const startTimeMinutes = toAbsoluteDayMinutes(shift.startTime)

        const endTimeMinutes = toAbsoluteDayMinutes(shift.endTime)

        if (startTimeMinutes > endTimeMinutes) {
          throw new DomainError(
            'TURNO COMEÇA APÓS TERMINAR',
            ERROR_CODE.HORARIO_FORA_DA_ESCALA,
          )
        }

        if (index + 1 >= workScheduleItem.shifts.length) {
          return
        }

        const nextStartTimeMinutes = toAbsoluteDayMinutes(
          workScheduleItem.shifts[index + 1].startTime,
        )

        if (endTimeMinutes > nextStartTimeMinutes) {
          throw new DomainError(
            'PRÓXIMO TURNO COMEÇA ANTES DO ATUAL TERMINAR',
            ERROR_CODE.HORARIO_FORA_DA_ESCALA,
          )
        }
      })
    }
  }

  async upsertWorkSchedule(
    id: number,
    workScheduleDto: CreateWorkScheduleDto[],
  ) {
    this.validateShifts(workScheduleDto)
    const existingWorkSchedule = await this.workScheduleRepository.findOne({
      where: {
        doctorId: id,
      },
    })

    if (existingWorkSchedule) {
      return this.workScheduleRepository.save({
        id: existingWorkSchedule.id,
        doctorId: existingWorkSchedule.doctorId,
        configuration: workScheduleDto.map((dto) => {
          return {
            duration: dto.durationMinutes,
            weekDay: dto.weekDay,
            time: dto.shifts,
          } satisfies WorkScheduleConfiguration
        }),
      })
    }

    const workSchedule = this.workScheduleRepository.create({
      doctorId: id,
      configuration: workScheduleDto.map((dto) => {
        return {
          duration: dto.durationMinutes,
          weekDay: dto.weekDay,
          time: dto.shifts,
        } satisfies WorkScheduleConfiguration
      }),
    })

    return this.workScheduleRepository.save(workSchedule)
  }
}
