import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator'
import { PaginationQueryDto } from '../../@common/dto/pagination-query.dto'
import { Type } from 'class-transformer'
import { APPOINTMENT_STATUS } from '../../@common/entities/appointment'

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/

export class AppointmentListDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'doctorId deve ser um número inteiro.' })
  @Min(1, { message: 'doctorId inválido.' })
  doctorId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'patientId deve ser um número inteiro.' })
  @Min(1, { message: 'patientId inválido.' })
  patientId?: number

  @IsOptional()
  @IsIn(Object.values(APPOINTMENT_STATUS), { message: 'status inválido.' })
  status?: APPOINTMENT_STATUS

  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'from deve estar no formato YYYY-MM-DD.' })
  @IsDateString(
    { strict: true },
    { message: 'from deve estar no formato YYYY-MM-DD.' },
  )
  from?: string

  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'to deve estar no formato YYYY-MM-DD.' })
  @IsDateString(
    { strict: true },
    { message: 'to deve estar no formato YYYY-MM-DD.' },
  )
  to?: string
}
