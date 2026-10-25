import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator'

export class DoctorCreateDto {
  @IsString({ message: 'Formato inválido para o nome.' })
  @IsNotEmpty({ message: 'Nome não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(6, 100, { message: 'Tamanho inválido para o nome.' })
  name!: string

  @IsNotEmpty({ message: 'E-mail não informado.' })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @Length(1, 150, { message: 'Tamanho inválido para o e-mail.' })
  email!: string

  @IsString({ message: 'Formato do senha informado inválido' })
  @IsNotEmpty({ message: 'Senha não informada.' })
  @Length(8, 75, { message: 'Tamanho mínimo ou máximo inválido para a senha.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,75}$/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.',
  })
  password!: string

  @IsString({ message: 'Formato inválido para o CRM.' })
  @IsNotEmpty({ message: 'CRM não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(4, 20, { message: 'Tamanho inválido para o CRM.' })
  crm!: string
}
