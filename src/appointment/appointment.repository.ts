import { Injectable } from '@nestjs/common'
import { Between, Repository } from 'typeorm'

import {
  Appointment,
  APPOINTMENT_STATUS,
} from '../@common/entities/appointment'
import { Doctor } from '../@common/entities/doctor'
import { Patient } from '../@common/entities/patient'
import { WorkSchedule } from '../@common/entities/work-schedule'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { toAbsoluteDayMinutes } from '../doctor/utils/utils'

@Injectable()
export class AppointmentRepository extends Repository<Appointment> {
  private checkConflict(
    appointments: Appointment[],
    newAppointment: {
      start: Date
      duration: number
    },
  ) {
    const newStartMs = newAppointment.start.getTime()
    const newEndMs =
      newAppointment.start.getTime() + newAppointment.duration * 60 * 1000
    appointments.forEach((appointment) => {
      const appointmentStart = appointment.date.getTime()
      const appointmentEnd =
        appointment.date.getTime() + appointment.duration * 60 * 1000
      // diferença do começo da nova consulta com o fim da atual
      const newStartToEnd = newStartMs - appointmentEnd
      const newEndToStart = newEndMs - appointmentStart

      if (newStartToEnd + newEndToStart === 0) {
        throw new DomainError(
          'Conflito de horário',
          ERROR_CODE.HORARIO_INDISPONIVEL,
        )
      }

      if (
        // começa antes de terminar
        newStartToEnd < 0 &&
        // termina antes de começar
        newEndToStart > 0
      ) {
        throw new DomainError(
          'Conflito de horário',
          ERROR_CODE.HORARIO_INDISPONIVEL,
        )
      }
    })
  }

  private checkWorkSchedule(
    appointment: Appointment,
    workSchedule: WorkSchedule,
  ) {
    const currentWeekDay = appointment.date.getDay()
    const appointmentStartMinutes = toAbsoluteDayMinutes(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
        timeStyle: 'short',
      }).format(appointment.date),
    )
    const appointmentEndMinutes = toAbsoluteDayMinutes(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC',
        timeStyle: 'short',
      }).format(
        new Date(appointment.date.getTime() + appointment.duration * 60 * 1000),
      ),
    )

    if (workSchedule.configuration.length === 0) {
      throw new DomainError('Fora de escala', ERROR_CODE.HORARIO_FORA_DA_ESCALA)
    }

    const weekDayConfiguration = workSchedule.configuration.find(
      (config) => config.weekDay === currentWeekDay,
    )

    if (!weekDayConfiguration) {
      throw new DomainError('Fora de escala', ERROR_CODE.HORARIO_FORA_DA_ESCALA)
    }

    if (appointment.duration !== weekDayConfiguration.duration) {
      throw new DomainError(
        'Duração incompatível com a escala',
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      )
    }

    const isInShift = weekDayConfiguration.time.some((time) => {
      const startTimeMinutes = toAbsoluteDayMinutes(time.startTime)

      const endTimeMinutes = toAbsoluteDayMinutes(time.endTime)

      if (
        appointmentStartMinutes > endTimeMinutes ||
        appointmentStartMinutes < startTimeMinutes ||
        appointmentEndMinutes > endTimeMinutes
      ) {
        return false
      }

      return true
    })

    if (!isInShift) {
      throw new DomainError(
        'Horário não permitido',
        ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      )
    }
  }

  async createAppointment(input: {
    doctorId: number
    patientId: number
    date: Date
    duration: number
  }): Promise<Appointment> {
    // TODO: Validar se a data do agendamento não é no passado

    const patient = await this.manager.getRepository(Patient).findOne({
      where: {
        id: input.patientId,
      },
    })

    if (!patient) {
      throw new DomainError(
        'Paciente não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }

    return await this.manager.transaction(async (tx) => {
      const doctorRepository = tx.getRepository(Doctor)
      const appointment = this.create({
        ...input,
        status: APPOINTMENT_STATUS.scheduled,
      })

      const doctor = await doctorRepository.findOne({
        where: {
          id: input.doctorId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      })

      const doctorWorkSchedule = await tx
        .getRepository(WorkSchedule)
        .findOneOrFail({
          where: {
            doctorId: input.doctorId,
          },
        })

      if (!doctor) {
        throw new DomainError(
          'Médico não encontrado',
          ERROR_CODE.RECURSO_NAO_ENCONTRADO,
        )
      }

      this.checkWorkSchedule(appointment, doctorWorkSchedule)

      const appointmentEnd = new Date(
        appointment.date.getTime() + appointment.duration * 60 * 1000,
      )

      const currentAppointments = await tx.find(Appointment, {
        where: {
          doctorId: input.doctorId,
          date: Between(input.date, appointmentEnd),
        },
      })

      this.checkConflict(currentAppointments, {
        start: input.date,
        duration: input.duration,
      })

      return await tx.save(appointment)
    })
  }
}
