import { Patient } from './../@common/entities/patient'
import { Module } from '@nestjs/common'
import { PatientController } from './patient.controller'
import { PatientService } from './patient.service'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'
import { PatientRepository } from './patient.repository'

@Module({
  controllers: [PatientController],
  providers: [
    PatientService,
    typeOrmRepositoryFactory(PatientRepository, Patient),
  ],
  exports: [PatientService],
})
export class PatientModule {}
