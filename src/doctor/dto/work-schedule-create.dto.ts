import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

export class ShiftDto {
  @IsInt({ message: 'weekDay deve ser um número inteiro.' })
  @Min(0, { message: 'weekDay deve estar entre 0 e 6.' })
  @Max(6, { message: 'weekDay deve estar entre 0 e 6.' })
  weekDay!: number

  @Matches(HH_MM, { message: 'startTime deve estar no formato HH:MM.' })
  startTime!: string

  @Matches(HH_MM, { message: 'endTime deve estar no formato HH:MM.' })
  endTime!: string

  @IsInt({ message: 'slotDurationMinutes deve ser um número inteiro.' })
  @Min(1, { message: 'slotDurationMinutes deve ser maior que zero.' })
  slotDurationMinutes!: number
}

export class WorkScheduleCreateDto {
  @IsArray({ message: 'shifts deve ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts!: ShiftDto[]
}
