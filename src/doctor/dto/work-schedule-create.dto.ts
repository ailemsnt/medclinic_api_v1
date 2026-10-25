import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsMilitaryTime,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

export class ShiftDto {
  @IsMilitaryTime()
  startTime!: string

  @IsMilitaryTime()
  endTime!: string
}

export class CreateWorkScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekDay!: number

  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number

  @Type(() => ShiftDto)
  @IsArray()
  @ValidateNested({ each: true })
  shifts!: ShiftDto[]
}