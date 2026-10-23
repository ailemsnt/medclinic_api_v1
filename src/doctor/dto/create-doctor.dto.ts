import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class DoctorCreateDto {
  @IsString({ message: 'Formato inválido para o nome.'})
  @IsNotEmpty({ message: 'Nome não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(6, 100, { message: 'Tamanho inválido para o nome.' })
  name!: string;

  @IsString({ message: 'Formato inválido para o CRM.'})
  @IsNotEmpty({ message: 'CRM não informado.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(4, 20, { message: 'Tamanho inválido para o CRM.' })
  crm!: string;
}