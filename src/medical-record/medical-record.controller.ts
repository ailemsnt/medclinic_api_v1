import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { GetUserJwt } from '../@common/decorators/get-user-jwt.decorator'
import type { AuthUserDto } from '../@common/dto/auth-user.dto'
import { MedicalRecordCreateDto } from './dto/medical-record-create.dto'
import { MedicalRecordResponseDto } from './dto/medical-record-response.dto'
import { MedicalRecordService } from './medical-record.service'
import { PaginationQueryDto } from '../@common/dto/pagination-query.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'

@Controller('patients')
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  @Post(':patientId/medical-records')
  @RequireRole([RoleName.DOCTOR])
  async create(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: MedicalRecordCreateDto,
    @GetUserJwt() user: AuthUserDto,
  ): Promise<MedicalRecordResponseDto> {
    return this.medicalRecordService.create(patientId, dto, user)
  }

  @Get(':patientId/medical-records')
  @RequireRole([RoleName.DOCTOR, RoleName.ADMIN])
  async findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: PaginationQueryDto,
    @GetUserJwt() user: AuthUserDto,
  ): Promise<PaginatedResponseDto<MedicalRecordResponseDto>> {
    return this.medicalRecordService.findByPatient(patientId, query, user)
  }
}
