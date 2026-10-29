import { Transform } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../@common/dto/pagination-query.dto'

export class PatientListDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Formato inválido para o nome.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string
}
