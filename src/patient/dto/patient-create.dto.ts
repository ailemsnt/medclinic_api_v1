import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class PatientCreateDto {
  @IsString({ message: 'Formato inválido para o nome.' })
  @IsNotEmpty({ message: 'Nome não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(1, 255, { message: 'Tamanho inválido para o nome.' })
  name!: string

  @IsString({ message: 'Formato inválido para o CPF.' })
  @IsNotEmpty({ message: 'CPF não informado.' })
  @Matches(/^\d{11}$/, { message: 'Formato inválido para o CPF.' })
  @Length(1, 255, { message: 'Tamanho inválido para o CPF.' })
  cpf!: string
}
