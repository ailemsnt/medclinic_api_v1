import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common'

import { AppointmentService } from './appointment.service'
import { AppointmentCreateDto } from './dto/appointment-create.dto'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { AppointmentResponseDto } from './dto/appointment-response.dto'
import { GetUserJwt } from '../@common/decorators/get-user-jwt.decorator'
import type { AuthUserDto } from '../@common/dto/auth-user.dto'
import { AppointmentListDto } from './dto/appointment-list.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @RequireRole([RoleName.ADMIN, RoleName.SECRETARY])
  async create(
    @Body() dto: AppointmentCreateDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.create(dto)
  }

  @Get()
  async findAll(
    @Query() query: AppointmentListDto,
    @GetUserJwt() user: AuthUserDto,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    return this.appointmentService.findAll(query, user)
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @GetUserJwt() user: AuthUserDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.findById(id, user)
  }
}
