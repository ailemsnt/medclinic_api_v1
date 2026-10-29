import { PatientListDto } from './dto/patient-list.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { PatientService } from './patient.service'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { PatientCreateDto } from './dto/patient-create.dto'
import { PatientResponseDto } from './dto/patient-response.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
import { PatientUpdateDto } from './dto/patient-update.dto'

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @RequireRole([RoleName.ADMIN, RoleName.SECRETARY])
  async create(@Body() dto: PatientCreateDto): Promise<PatientResponseDto> {
    return this.patientService.create(dto)
  }

  @Get()
  async findAll(
    @Query() query: PatientListDto,
  ): Promise<PaginatedResponseDto<PatientResponseDto>> {
    return this.patientService.findAll(query)
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PatientResponseDto> {
    return this.patientService.findById(id)
  }

  @Patch(':id')
  @RequireRole([RoleName.ADMIN, RoleName.SECRETARY])
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PatientUpdateDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto)
  }

  @Delete(':id')
  @RequireRole([RoleName.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.patientService.remove(id)
  }
}
