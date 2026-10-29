import { WorkScheduleConfiguration } from '../work-schedule.entity'
import { timeToMinutes } from '../utils/utils'
import { ShiftDto } from './work-schedule-create.dto'

export class WorkScheduleResponseDto {
  shifts!: ShiftDto[]

  static resultEntity(
    configuration: WorkScheduleConfiguration[],
  ): WorkScheduleResponseDto {
    const shifts = configuration
      .flatMap((config) =>
        config.time.map((time) => ({
          weekDay: config.weekDay,
          startTime: time.startTime,
          endTime: time.endTime,
          slotDurationMinutes: config.duration,
        })),
      )
      .sort(
        (a, b) =>
          a.weekDay - b.weekDay ||
          timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      )

    return { shifts }
  }
}
