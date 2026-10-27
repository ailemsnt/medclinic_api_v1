import { Injectable } from '@nestjs/common'
import { AppointmentRepository } from './appointment.repository'
import { AppointmentCreateDto } from './dto/appointment-create.dto'
import { DoctorRepository } from '../doctor/doctor.repository'
import { AppointmentResponseDto } from './dto/appointment-response.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
import { clinicDayStart } from '../doctor/utils/utils'
import { AuthUserDto } from '../@common/dto/auth-user.dto'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { RoleName } from '../@common/entities/role'
import { AppointmentListDto } from './dto/appointment-list.dto'
import { WorkScheduleRepository } from '../doctor/work-schedule.repository'
import {
  DoctorCalendarAppointmentDto,
  DoctorCalendarQueryDto,
  DoctorCalendarResponseDto,
} from '../doctor/dto/doctor-calendar.dto'
import { WorkScheduleResponseDto } from '../doctor/dto/work-schedule-response.dto'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_CALENDAR_DAYS = 31

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly workScheduleRepository: WorkScheduleRepository,
  ) {}

  async create(dto: AppointmentCreateDto): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.createAppointment({
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      startsAt: new Date(dto.startsAt),
    })

    return AppointmentResponseDto.resultEntity(appointment)
  }

  async findById(
    id: number,
    user: AuthUserDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(id)
    if (!appointment) {
      throw new DomainError(
        'Agendamento não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    const ownDoctorId = await this.getDoctorProfileId(user)
    if (ownDoctorId !== undefined && appointment.doctorId !== ownDoctorId) {
      throw new DomainError('Acesso negado', ERROR_CODE.ACESSO_NEGADO)
    }

    return AppointmentResponseDto.resultEntity(appointment)
  }

  async findAll(
    query: AppointmentListDto,
    user: AuthUserDto,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    const ownDoctorId = await this.getDoctorProfileId(user)
    if (ownDoctorId === null) {
      return PaginatedResponseDto.create([], 0, query.page, query.pageSize)
    }

    const [appointments, total] = await this.appointmentRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      doctorId: ownDoctorId ?? query.doctorId,
      patientId: query.patientId,
      status: query.status,
      from: query.from ? clinicDayStart(query.from) : undefined,
      to: query.to
        ? new Date(clinicDayStart(query.to).getTime() + ONE_DAY_MS)
        : undefined,
    })

    return PaginatedResponseDto.create(
      appointments.map((appointment) =>
        AppointmentResponseDto.resultEntity(appointment),
      ),
      total,
      query.page,
      query.pageSize,
    )
  }

  async getDoctorCalendar(
    doctorId: number,
    query: DoctorCalendarQueryDto,
  ): Promise<DoctorCalendarResponseDto> {
    const periodStart = clinicDayStart(query.from)
    const periodEnd = new Date(clinicDayStart(query.to).getTime() + ONE_DAY_MS)
    const periodDays =
      (periodEnd.getTime() - periodStart.getTime()) / ONE_DAY_MS

    if (periodDays < 1 || periodDays > MAX_CALENDAR_DAYS) {
      throw new DomainError(
        `O período deve ter de 1 a ${MAX_CALENDAR_DAYS} dias, com from anterior ou igual a to.`,
        ERROR_CODE.DADOS_INVALIDOS,
      )
    }

    const doctorExists = await this.doctorRepository.existsBy({ id: doctorId })
    if (!doctorExists) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    const workSchedule =
      await this.workScheduleRepository.findByDoctorId(doctorId)
    const appointments =
      await this.appointmentRepository.findActiveByDoctorInPeriod(
        doctorId,
        periodStart,
        periodEnd,
      )

    return {
      workSchedule: WorkScheduleResponseDto.resultEntity(
        workSchedule?.configuration ?? [],
      ),
      appointments: appointments.map((appointment) =>
        DoctorCalendarAppointmentDto.resultEntity(appointment),
      ),
    }
  }

  private async getDoctorProfileId(
    user: AuthUserDto,
  ): Promise<number | null | undefined> {
    const roles = user.data.roles ?? []
    if (!roles.includes(RoleName.DOCTOR) || roles.includes(RoleName.ADMIN)) {
      return undefined
    }

    const doctor = await this.doctorRepository.findByUserId(Number(user.sub))
    return doctor?.id ?? null
  }
}
