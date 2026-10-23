import { Injectable } from '@nestjs/common'

import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto'
import { toAbsoluteDayMinutes } from './utils/utils'
import { WorkScheduleRepository } from './work-schedule.repository'
import { WorkScheduleConfiguration } from '../@common/entities/work-schedule'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'

@Injectable()
export class DoctorService {
  constructor(
    private readonly workScheduleRepository: WorkScheduleRepository,
  ) {}

  private validateShifts(workSchedule: CreateWorkScheduleDto[]) {
    for (const workScheduleItem of workSchedule) {
      workScheduleItem.shifts.sort((a, b) => {
        const aDayMinutes = toAbsoluteDayMinutes(a.startTime)

        const bDayMinutes = toAbsoluteDayMinutes(b.startTime)

        return aDayMinutes - bDayMinutes
      })

      workScheduleItem.shifts.forEach((shift, index) => {
        const startTimeMinutes = toAbsoluteDayMinutes(shift.startTime)

        const endTimeMinutes = toAbsoluteDayMinutes(shift.endTime)

        if (startTimeMinutes > endTimeMinutes) {
          throw new DomainError(
            'TURNO COMEÇA APÓS TERMINAR',
            ERROR_CODE.HORARIO_FORA_DA_ESCALA,
          )
        }

        if (index + 1 >= workScheduleItem.shifts.length) {
          return
        }

        const nextStartTimeMinutes = toAbsoluteDayMinutes(
          workScheduleItem.shifts[index + 1].startTime,
        )

        if (endTimeMinutes > nextStartTimeMinutes) {
          throw new DomainError(
            'PRÓXIMO TURNO COMEÇA ANTES DO ATUAL TERMINAR',
            ERROR_CODE.HORARIO_FORA_DA_ESCALA,
          )
        }
      })
    }
  }

  async upsertWorkSchedule(
    id: number,
    workScheduleDto: CreateWorkScheduleDto[],
  ) {
    this.validateShifts(workScheduleDto)
    const existingWorkSchedule = await this.workScheduleRepository.findOne({
      where: {
        doctorId: id,
      },
    })

    if (existingWorkSchedule) {
      return this.workScheduleRepository.save({
        id: existingWorkSchedule.id,
        doctorId: existingWorkSchedule.doctorId,
        configuration: workScheduleDto.map((dto) => {
          return {
            duration: dto.durationMinutes,
            weekDay: dto.weekDay,
            time: dto.shifts,
          } satisfies WorkScheduleConfiguration
        }),
      })
    }

    const workSchedule = this.workScheduleRepository.create({
      doctorId: id,
      configuration: workScheduleDto.map((dto) => {
        return {
          duration: dto.durationMinutes,
          weekDay: dto.weekDay,
          time: dto.shifts,
        } satisfies WorkScheduleConfiguration
      }),
    })

    return this.workScheduleRepository.save(workSchedule)
  }
}