import { Transform } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

export class PatientUpdateDto {
  @IsOptional()
  @IsString({ message: 'Formato inválido para o nome.' })
  @IsNotEmpty({ message: 'Nome não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(1, 255, { message: 'Tamanho inválido para o nome.' })
  name!: string
}
