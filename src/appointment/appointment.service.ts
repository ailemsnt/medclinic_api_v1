import { Injectable } from '@nestjs/common'

import { AppointmentRepository } from './appointment.repository'
import { CreateAppointmentDto } from './dto/create-appointment.dto'

@Injectable()
export class AppointmentService {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async create(dto: CreateAppointmentDto) {
    const { startDate, ...rest } = dto
    return await this.appointmentRepository.createAppointment({
      ...rest,
      date: new Date(startDate),
    })
  }
}