import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'

import { DoctorService } from './doctor.service'
import { CreateWorkScheduleDto } from './dto/work-schedule-create.dto'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role.entity'
import { DoctorCreateDto } from './dto/doctor-create.dto'
import { DoctorResponseDto } from './dto/doctor-response'
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

  @RequireRole([RoleName.DOCTOR, RoleName.ADMIN])
  @Put(':id/work-schedule')
  async createWorkSchedule(
    @Param('id') id: number,
    @Body(
      new ParseArrayPipe({
        items: CreateWorkScheduleDto,
      }),
    )
    workScheduleDto: CreateWorkScheduleDto[],
  ) {
    return this.doctorService.upsertWorkSchedule(id, workScheduleDto)
  }
}
