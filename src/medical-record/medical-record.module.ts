import { Module } from '@nestjs/common'
import { AppointmentModule } from '../appointment/appointment.module'
import { DoctorModule } from '../doctor/doctor.module'
import { MedicalRecordController } from './medical-record.controller'
import { MedicalRecordService } from './medical-record.service'
import { MedicalRecordRepository } from './medical-record.repository'
import { MedicalRecord } from '../@common/entities/medical-record'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'

@Module({
  imports: [AppointmentModule, DoctorModule],
  controllers: [MedicalRecordController],
  providers: [
    MedicalRecordService,
    typeOrmRepositoryFactory(MedicalRecordRepository, MedicalRecord),
  ],
})
export class MedicalRecordModule {}
