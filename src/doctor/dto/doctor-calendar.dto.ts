import { IsDateString, Matches } from 'class-validator'
import {
  Appointment,
  APPOINTMENT_STATUS,
} from '../../@common/entities/appointment'
import { WorkScheduleResponseDto } from './work-schedule-response.dto'

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/

export class DoctorCalendarQueryDto {
  @Matches(YYYY_MM_DD, { message: 'from deve estar no formato YYYY-MM-DD.' })
  @IsDateString({ strict: true }, { message: 'from deve ser uma data válida.' })
  from!: string

  @Matches(YYYY_MM_DD, { message: 'to deve estar no formato YYYY-MM-DD.' })
  @IsDateString({ strict: true }, { message: 'to deve ser uma data válida.' })
  to!: string
}

export class DoctorCalendarAppointmentDto {
  id!: number
  patientId!: number
  startsAt!: Date
  endsAt!: Date
  status!: APPOINTMENT_STATUS

  static resultEntity(appointment: Appointment): DoctorCalendarAppointmentDto {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
    }
  }
}

export class DoctorCalendarResponseDto {
  workSchedule!: WorkScheduleResponseDto
  appointments!: DoctorCalendarAppointmentDto[]
}
