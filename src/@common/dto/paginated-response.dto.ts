export class PaginationMetaDto {
  total!: number;
  page!: number;
  pageSize!: number;
  totalPages!: number;
}

export class PaginatedResponseDto<TotalPages> {
  data!: TotalPages[];
  meta!: PaginationMetaDto;

  static create<TotalPages> (data: TotalPages[], total: number, page: number, pageSize: number): PaginatedResponseDto<TotalPages> {
    const totalPages = Math.ceil(total / pageSize);
    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages
      }
    };
  }
}