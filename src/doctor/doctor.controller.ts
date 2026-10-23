import { Body, Controller, Param, ParseArrayPipe, Put, UseGuards } from '@nestjs/common'

import { DoctorService } from './doctor.service'
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { Roles } from '../@common/entities/enums/roles.enum'
import { JwtGuard } from '../@common/guards/jwt.guard'
import { RolesGuard } from '../@common/guards/roles.guard'

@UseGuards(JwtGuard, RolesGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @RequireRole([Roles.DOCTOR, Roles.ADMIN])
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