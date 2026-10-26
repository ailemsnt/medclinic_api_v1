import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common'
import { WorkScheduleService } from './work-schedule.service'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { WorkScheduleCreateDto } from './dto/work-schedule-create.dto'
import { WorkScheduleResponseDto } from './dto/work-schedule-response.dto'

@Controller('doctors')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Put(':doctorId/work-schedule')
  @RequireRole([RoleName.ADMIN])
  async replace(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: WorkScheduleCreateDto,
  ): Promise<WorkScheduleResponseDto> {
    return this.workScheduleService.replace(doctorId, dto)
  }

  @Get(':doctorId/work-schedule')
  async findByDoctor(
    @Param('doctorId', ParseIntPipe) doctorId: number,
  ): Promise<WorkScheduleResponseDto> {
    return this.workScheduleService.findByDoctor(doctorId)
  }
}
