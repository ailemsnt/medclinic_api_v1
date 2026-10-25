import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../@common/dto/pagination-query.dto";
import { Transform } from "class-transformer";

export class DoctorListDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Formato inválido para o nome.' })
  @Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    )
  name?: string;
}