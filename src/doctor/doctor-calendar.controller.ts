import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { AppointmentService } from '../appointment/appointment.service'
import {
  DoctorCalendarQueryDto,
  DoctorCalendarResponseDto,
} from './dto/doctor-calendar.dto'

@Controller('doctors')
export class DoctorCalendarController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get(':doctorId/calendar')
  async getDoctorCalendar(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query() query: DoctorCalendarQueryDto,
  ): Promise<DoctorCalendarResponseDto> {
    return this.appointmentService.getDoctorCalendar(doctorId, query)
  }
}
