import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class MedicalRecordCreateDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'text deve ser um texto.' })
  @IsNotEmpty({ message: 'text é obrigatório.' })
  text!: string

  @IsOptional()
  doctorId?: unknown
}
