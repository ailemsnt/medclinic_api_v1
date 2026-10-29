import { Injectable } from '@nestjs/common'
import {
  AppointmentRepository,
  AppointmentTransaction,
} from './appointment.repository'
import { AppointmentCreateDto } from './dto/appointment-create.dto'
import { DoctorRepository } from '../doctor/doctor.repository'
import { AppointmentResponseDto } from './dto/appointment-response.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
import {
  clinicDayStart,
  timeToMinutes,
  toClinicTime,
} from '../doctor/utils/utils'
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
import {
  Appointment,
  APPOINTMENT_STATUS,
} from '../@common/entities/appointment'
import { AppointmentStatusUpdateDto } from './dto/appointment-status-update.dto'
import { WorkSchedule } from '../doctor/work-schedule.entity'

const ONE_MINUTE_MS = 60 * 1000
const ONE_DAY_MS = 24 * 60 * ONE_MINUTE_MS
const MAX_CALENDAR_DAYS = 31
const APPOINTMENT_DOCTOR = 'appointmentDoctor'
type TransitionActor = RoleName | typeof APPOINTMENT_DOCTOR

const ALLOWED_TRANSITIONS: Record<
  APPOINTMENT_STATUS,
  Partial<Record<APPOINTMENT_STATUS, TransitionActor[]>>
> = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    [APPOINTMENT_STATUS.IN_PROGRESS]: [RoleName.ADMIN, APPOINTMENT_DOCTOR],
    [APPOINTMENT_STATUS.CANCELLED]: [
      RoleName.ADMIN,
      RoleName.SECRETARY,
      APPOINTMENT_DOCTOR,
    ],
  },
  [APPOINTMENT_STATUS.IN_PROGRESS]: {
    [APPOINTMENT_STATUS.DONE]: [RoleName.ADMIN, APPOINTMENT_DOCTOR],
    [APPOINTMENT_STATUS.CANCELLED]: [RoleName.ADMIN, APPOINTMENT_DOCTOR],
  },
  [APPOINTMENT_STATUS.DONE]: {},
  [APPOINTMENT_STATUS.CANCELLED]: {},
}

export interface Period {
  startsAt: Date
  endsAt: Date
}

/* Sobrepõe quando um começa antes do outro terminar. Encostado não conflita. */
export function periodsOverlap(first: Period, second: Period): boolean {
  return first.startsAt < second.endsAt && second.startsAt < first.endsAt
}
@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly workScheduleRepository: WorkScheduleRepository,
  ) {}

  async create(dto: AppointmentCreateDto): Promise<AppointmentResponseDto> {
    const startsAt = new Date(dto.startsAt)

    const patientExists = await this.appointmentRepository.patientExists(
      dto.patientId,
    )
    if (!patientExists) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    const appointment = await this.appointmentRepository.runInTransaction(
      (transaction) =>
        this.createInTransaction(transaction, {
          doctorId: dto.doctorId,
          patientId: dto.patientId,
          startsAt,
        }),
    )

    return AppointmentResponseDto.resultEntity(appointment)
  }

  /** RF06/RF07: valida e grava com a linha do médico travada até o fim. */
  private async createInTransaction(
    transaction: AppointmentTransaction,
    input: { doctorId: number; patientId: number; startsAt: Date },
  ): Promise<Appointment> {
    const doctorExists = await transaction.lockDoctor(input.doctorId)
    if (!doctorExists) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    const workSchedule = await transaction.findWorkSchedule(input.doctorId)
    const duration = this.getSlotDuration(input.startsAt, workSchedule)
    const newPeriod: Period = {
      startsAt: input.startsAt,
      endsAt: new Date(input.startsAt.getTime() + duration * ONE_MINUTE_MS),
    }

    const doctorAppointments = await transaction.findActiveInPeriod(
      { doctorId: input.doctorId },
      newPeriod.startsAt,
      newPeriod.endsAt,
    )
    if (
      doctorAppointments.some((existing) => periodsOverlap(existing, newPeriod))
    ) {
      throw new DomainError(
        'Este horário acabou de ser ocupado.',
        ERROR_CODE.HORARIO_INDISPONIVEL,
      )
    }

    const patientAppointments = await transaction.findActiveInPeriod(
      { patientId: input.patientId },
      newPeriod.startsAt,
      newPeriod.endsAt,
    )
    if (
      patientAppointments.some((existing) =>
        periodsOverlap(existing, newPeriod),
      )
    ) {
      throw new DomainError(
        'O paciente já possui consulta neste horário.',
        ERROR_CODE.PACIENTE_INDISPONIVEL,
      )
    }

    return transaction.createAppointment({
      doctorId: input.doctorId,
      patientId: input.patientId,
      ...newPeriod,
    })
  }

  /** RN07: dentro de um turno, alinhado à grade e cabendo inteiro no turno. */
  private getSlotDuration(
    startsAt: Date,
    workSchedule: WorkSchedule | null,
  ): number {
    const { weekDay, minutes } = toClinicTime(startsAt)
    const isWholeMinute = startsAt.getTime() % ONE_MINUTE_MS === 0

    const configuration = workSchedule?.configuration
      .filter((config) => config.weekDay === weekDay)
      .find((config) =>
        config.time.some((time) => {
          const startTimeMinutes = timeToMinutes(time.startTime)
          const endTimeMinutes = timeToMinutes(time.endTime)

          return (
            minutes >= startTimeMinutes &&
            (minutes - startTimeMinutes) % config.duration === 0 &&
            minutes + config.duration <= endTimeMinutes
          )
        }),
      )

    if (!configuration || !isWholeMinute) {
      throw new DomainError(
        'Horário fora da escala do médico.',
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      )
    }

    return configuration.duration
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

  async updateStatus(
    id: number,
    dto: AppointmentStatusUpdateDto,
    user: AuthUserDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById(id)
    if (!appointment) {
      throw new DomainError(
        'Agendamento não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    const allowedActors = ALLOWED_TRANSITIONS[appointment.status][dto.status]
    if (!allowedActors) {
      throw new DomainError(
        `Transição de ${appointment.status} para ${dto.status} não é permitida.`,
        ERROR_CODE.TRANSICAO_INVALIDA,
      )
    }

    const userActors = await this.getTransitionActors(user, appointment)
    const canTransition = allowedActors.some((actor) =>
      userActors.includes(actor),
    )
    if (!canTransition) {
      throw new DomainError(
        'Seu perfil não pode fazer esta alteração de status.',
        ERROR_CODE.ACESSO_NEGADO,
      )
    }

    const updated = await this.appointmentRepository.updateStatus(
      id,
      appointment.status,
      dto.status,
    )
    if (!updated) {
      throw new DomainError(
        'O status do agendamento foi alterado por outra pessoa. Consulte novamente.',
        ERROR_CODE.TRANSICAO_INVALIDA,
      )
    }

    return AppointmentResponseDto.resultEntity({
      ...appointment,
      status: dto.status,
    })
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

    const doctorExists = await this.doctorRepository.findById(doctorId)
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

  private async getTransitionActors(
    user: AuthUserDto,
    appointment: Appointment,
  ): Promise<TransitionActor[]> {
    const roles: TransitionActor[] = [...(user.data.roles ?? [])]

    if (roles.includes(RoleName.DOCTOR)) {
      const doctor = await this.doctorRepository.findByUserId(Number(user.sub))
      if (doctor?.id === appointment.doctorId) {
        roles.push(APPOINTMENT_DOCTOR)
      }
    }

    return roles
  }
}
