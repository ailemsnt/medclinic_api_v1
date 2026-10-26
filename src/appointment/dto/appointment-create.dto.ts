import { IsInt, IsISO8601, Matches, Min } from 'class-validator'

export class AppointmentCreateDto {
  @IsInt({ message: 'doctorId deve ser um número inteiro.' })
  @Min(1, { message: 'doctorId inválido.' })
  doctorId!: number

  @IsInt({ message: 'patientId deve ser um número inteiro.' })
  @Min(1, { message: 'patientId inválido.' })
  patientId!: number

  @IsISO8601({ strict: true }, { message: 'startsAt deve estar em ISO 8601.' })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, {
    message: 'startsAt deve informar o fuso (Z ou ±HH:MM).',
  })
  startsAt!: string
}
