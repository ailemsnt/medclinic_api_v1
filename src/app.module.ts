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
import { Patient } from './patient/patient.entity'
import { AppointmentModule } from './appointment/appointment.module'

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    Patient,
    AuthModule,
    DoctorModule,
    JwtModule,
    AppointmentModule,
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
