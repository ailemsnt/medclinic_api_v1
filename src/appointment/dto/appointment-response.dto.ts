import {
  Appointment,
  APPOINTMENT_STATUS,
} from '../../@common/entities/appointment'

export class AppointmentResponseDto {
  id!: number
  doctorId!: number
  patientId!: number
  startsAt!: Date
  endsAt!: Date
  status!: APPOINTMENT_STATUS

  static resultEntity(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
    }
  }
}
