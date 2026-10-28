import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator'
import { Transform } from 'class-transformer'
import { RoleName } from '../../@common/entities/role'

export class UserCreateDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(6, 100, { message: 'Tamanho mínimo inválido para o nome.' })
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

  @IsArray({ message: 'roles deve ser uma lista.' })
  @ArrayNotEmpty({ message: 'Informe ao menos um perfil.' })
  @IsIn([RoleName.ADMIN, RoleName.SECRETARY], {
    each: true,
    message: 'Perfil inválido. Use admin ou secretary.',
  })
  roles!: RoleName[]
}
