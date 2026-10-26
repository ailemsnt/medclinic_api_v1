import { Module } from '@nestjs/common'
import { DoctorController } from './doctor.controller'
import { DoctorRepository } from './doctor.repository'
import { DoctorService } from './doctor.service'
import { WorkScheduleRepository } from './work-schedule.repository'
import { Doctor } from '../@common/entities/doctor'
import { WorkSchedule } from '../@common/entities/work-schedule'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'
import { UserModule } from '../user/user.module'
import { WorkScheduleController } from './work-schedule.controller'
import { WorkScheduleService } from './work-schedule.service'

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
