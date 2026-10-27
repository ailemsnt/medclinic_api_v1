import { IsIn } from 'class-validator'
import { APPOINTMENT_STATUS } from '../../@common/entities/appointment'

export class AppointmentStatusUpdateDto {
  @IsIn(Object.values(APPOINTMENT_STATUS), {
    message: `status deve ser um dos valores: ${Object.values(APPOINTMENT_STATUS).join(', ')}.`,
  })
  status!: APPOINTMENT_STATUS
}
