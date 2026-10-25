import { Module } from '@nestjs/common'

import { AppointmentController } from './appointment.controller'
import { AppointmentService } from './appointment.service'
import { Appointment } from '../@common/entities/appointment'
import { AppointmentRepository } from './appointment.repository'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'

@Module({
  imports: [],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    typeOrmRepositoryFactory(AppointmentRepository, Appointment),
  ],
})
export class AppointmentModule {}