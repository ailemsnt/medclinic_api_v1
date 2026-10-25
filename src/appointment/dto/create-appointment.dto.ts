import { IsDateString, IsInt, Max, Min } from 'class-validator'

export class CreateAppointmentDto {
  @IsInt()
  doctorId!: number

  @IsInt()
  patientId!: number

  @IsDateString()
  startDate!: string

  @IsInt()
  @Min(0)
  @Max(1440)
  duration!: number
}
