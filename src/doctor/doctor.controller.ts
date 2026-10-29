import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'

import { DoctorService } from './doctor.service'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { DoctorCreateDto } from './dto/doctor-create.dto'
import { DoctorResponseDto } from './dto/doctor-response.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
import { DoctorListDto } from './dto/doctor-list.dto'

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @RequireRole([RoleName.ADMIN])
  async createDoctor(@Body() dto: DoctorCreateDto): Promise<DoctorResponseDto> {
    return this.doctorService.create(dto)
  }

  @Get()
  async findAll(
    @Query() query: DoctorListDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    return this.doctorService.findAll(query)
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DoctorResponseDto> {
    return this.doctorService.findById(id)
  }
}
