import { Module } from '@nestjs/common'
import { DoctorController } from './doctor.controller'
import { DoctorRepository } from './doctor.repository'
import { DoctorService } from './doctor.service'
import { WorkScheduleRepository } from './work-schedule.repository'
import { WorkSchedule } from './work-schedule.entity'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'
import { UserModule } from '../user/user.module'
import { WorkScheduleController } from './work-schedule.controller'
import { WorkScheduleService } from './work-schedule.service'
import { Doctor } from './doctor.entity'

@Module({
  imports: [UserModule],
  controllers: [DoctorController, WorkScheduleController],
  providers: [
    DoctorService,
    WorkScheduleService,
    typeOrmRepositoryFactory(DoctorRepository, Doctor),
    typeOrmRepositoryFactory(WorkScheduleRepository, WorkSchedule),
  ],
  exports: [DoctorRepository, WorkScheduleRepository],
})
export class DoctorModule {}
