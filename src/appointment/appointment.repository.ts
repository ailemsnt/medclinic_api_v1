import { Injectable } from '@nestjs/common'
import { Appointment } from './../@common/entities/appointment'
import {
  Repository,
  FindOptionsWhere,
  Not,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  And,
  In,
} from 'typeorm'

import { APPOINTMENT_STATUS } from '../@common/entities/appointment'
import { Patient } from '../patient/patient.entity'
import { WorkSchedule } from '../doctor/work-schedule.entity'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { timeToMinutes, toClinicTime } from '../doctor/utils/utils'
import { Doctor } from '../doctor/doctor.entity'

export interface AppointmentCreateInput {
  doctorId: number
  patientId: number
  startsAt: Date
}

export interface AppointmentFindFilter {
  page: number
  pageSize: number
  doctorId?: number
  patientId?: number
  status?: APPOINTMENT_STATUS
  from?: Date
  to?: Date
}
@Injectable()
export class AppointmentRepository extends Repository<Appointment> {
  private getSlotDuration(
    startsAt: Date,
    workSchedule: WorkSchedule | null,
  ): number {
    const { weekDay, minutes } = toClinicTime(startsAt)
    const isWholeMinute = startsAt.getTime() % 60000 === 0

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

  async createAppointment(input: AppointmentCreateInput): Promise<Appointment> {
    // TODO: Validar se a data do agendamento não é no passado
    const patientExists = await this.manager.getRepository(Patient).findOne({
      where: {
        id: input.patientId,
      },
    })

    if (!patientExists) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    return await this.manager.transaction(async (transcationManager) => {
      const doctorRepository = transcationManager.getRepository(Doctor)

      const doctorExists = await doctorRepository.findOne({
        where: {
          id: input.doctorId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      })

      if (!doctorExists) {
        throw new DomainError(
          'Médico não encontrado',
          ERROR_CODE.RECURSO_NAO_ENCONTRADO,
        )
      }

      const doctorWorkSchedule = await transcationManager
        .getRepository(WorkSchedule)
        .findOneOrFail({
          where: {
            doctorId: input.doctorId,
          },
        })

      const duration = this.getSlotDuration(input.startsAt, doctorWorkSchedule)
      const endsAt = new Date(input.startsAt.getTime() + duration * 60 * 1000)

      //to check conflicts on schedule
      const overlapSchedule: FindOptionsWhere<Appointment> = {
        status: Not(APPOINTMENT_STATUS.CANCELLED),
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(input.startsAt),
      }

      if (
        await transcationManager.exists(Appointment, {
          where: { ...overlapSchedule, doctorId: input.doctorId },
        })
      ) {
        throw new DomainError(
          'Horário indisponível',
          ERROR_CODE.HORARIO_INDISPONIVEL,
        )
      }

      if (
        await transcationManager.exists(Appointment, {
          where: { ...overlapSchedule, patientId: input.patientId },
        })
      ) {
        throw new DomainError(
          'O pacinte já possui consulta agendada neste horário',
          ERROR_CODE.PACIENTE_INDISPONIVEL,
        )
      }

      const appointment = transcationManager.create(Appointment, {
        ...input,
        endsAt,
        status: APPOINTMENT_STATUS.SCHEDULED,
      })

      return await transcationManager.save(appointment)
    })
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.findOne({ where: { id } })
  }

  async findAll(
    filter: AppointmentFindFilter,
  ): Promise<[Appointment[], number]> {
    const where: FindOptionsWhere<Appointment> = {}

    if (filter.doctorId) where.doctorId = filter.doctorId
    if (filter.patientId) where.patientId = filter.patientId
    if (filter.status) where.status = filter.status

    if (filter.from && filter.to) {
      where.startsAt = And(MoreThanOrEqual(filter.from), LessThan(filter.to))
    } else if (filter.from) {
      where.startsAt = MoreThanOrEqual(filter.from)
    } else if (filter.to) {
      where.startsAt = LessThan(filter.to)
    }

    return this.findAndCount({
      where,
      order: { startsAt: 'ASC' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    })
  }

  async findActiveByDoctorInPeriod(
    doctorId: number,
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    return this.find({
      where: {
        doctorId,
        status: Not(APPOINTMENT_STATUS.CANCELLED),
        startsAt: LessThan(to),
        endsAt: MoreThan(from),
      },
      order: { startsAt: 'ASC' },
    })
  }

  async hasAppointmentInProgress(
    doctorId: number,
    patientId: number,
  ): Promise<boolean> {
    const inProgressOrDone = this.exists({
      where: {
        doctorId,
        patientId,
        status: In([APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.DONE]),
      },
    })

    return inProgressOrDone
  }

  async findAppointmentInPeriod(
    doctorId: number,
    fromDate: Date,
    toDate: Date,
  ): Promise<Appointment[]> {
    const appointment = this.find({
      where: {
        doctorId,
        status: Not(APPOINTMENT_STATUS.CANCELLED),
        startsAt: LessThan(fromDate),
        endsAt: MoreThan(toDate),
      },
      order: { startsAt: 'ASC' },
    })

    return appointment
  }
}
