import { Module } from '@nestjs/common'
import { DoctorController } from './doctor.controller'
import { DoctorRepository } from './doctor.repository'
import { DoctorService } from './doctor.service'
import { WorkScheduleRepository } from './work-schedule.repository'
import { Doctor } from '../@common/entities/doctor'
import { WorkSchedule } from '../@common/entities/work-schedule'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'

@Module({
  controllers: [DoctorController],
  providers: [
    DoctorService,
    typeOrmRepositoryFactory(DoctorRepository, Doctor),
    typeOrmRepositoryFactory(WorkScheduleRepository, WorkSchedule),
  ],
})
export class DoctorModule {}