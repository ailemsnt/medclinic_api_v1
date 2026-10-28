import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { AllHttpExceptionFilter } from './@common/filters/all-http-exception.filter'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { DoctorModule } from './doctor/doctor.module'
import { JwtGuard } from './@common/guards/jwt.guard'
import { DatabaseModule } from './@common/database/database.module'
import { JwtModule } from './auth/jwt/jwt.module'
import { HealthController } from './health/health.controller'
import { AppointmentModule } from './appointment/appointment.module'
import { PatientModule } from './patient/patient.module'
import { MedicalRecordModule } from './medical-record/medical-record.module'

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    PatientModule,
    AuthModule,
    DoctorModule,
    JwtModule,
    AppointmentModule,
    MedicalRecordModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionFilter,
    },
  ],
})
export class AppModule {}
