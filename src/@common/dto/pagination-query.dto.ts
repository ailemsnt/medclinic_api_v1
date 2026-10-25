import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Valor inválido para page'})
  @Min(1, { message: 'Valor inválido para page. Deve ser maior ou igual a 1'})
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Valor inválido para pageSize'})
  @Min(1, { message: 'Valor inválido para pageSize. Deve ser maior ou igual a 1'})
  @Max( 100, { message: 'Valor inválido para pageSize. Deve ser no máximo 100'})
  pageSize: number = 20;
}