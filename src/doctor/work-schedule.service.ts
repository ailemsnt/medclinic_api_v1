import { Injectable } from '@nestjs/common'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { WorkScheduleRepository } from './work-schedule.repository'
import { DoctorRepository } from './doctor.repository'
import { ShiftDto, WorkScheduleCreateDto } from './dto/work-schedule-create.dto'
import { WorkScheduleResponseDto } from './dto/work-schedule-response.dto'
import { timeToMinutes } from './utils/utils'
import { WorkScheduleConfiguration } from './work-schedule.entity'

@Injectable()
export class WorkScheduleService {
  constructor(
    private readonly workScheduleRepository: WorkScheduleRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  async replace(
    doctorId: number,
    dto: WorkScheduleCreateDto,
  ): Promise<WorkScheduleResponseDto> {
    await this.ensureDoctorExists(doctorId)

    this.validateShifts(dto.shifts)
    const configuration = this.toConfiguration(dto.shifts)

    await this.workScheduleRepository.replaceConfiguration(
      doctorId,
      configuration,
    )

    return WorkScheduleResponseDto.resultEntity(configuration)
  }

  async findByDoctor(doctorId: number): Promise<WorkScheduleResponseDto> {
    await this.ensureDoctorExists(doctorId)

    const workSchedule =
      await this.workScheduleRepository.findByDoctorId(doctorId)

    return WorkScheduleResponseDto.resultEntity(
      workSchedule?.configuration ?? [],
    )
  }

  private validateShifts(shifts: ShiftDto[]): void {
    const sortedShifts = [...shifts].sort(
      (a, b) =>
        a.weekDay - b.weekDay ||
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    )

    sortedShifts.forEach((shift, index) => {
      if (timeToMinutes(shift.startTime) >= timeToMinutes(shift.endTime)) {
        throw new DomainError(
          'O início do turno deve ser anterior ao fim.',
          ERROR_CODE.DADOS_INVALIDOS,
        )
      }

      const previousShift = index > 0 ? sortedShifts[index - 1] : undefined

      if (
        previousShift &&
        previousShift.weekDay === shift.weekDay &&
        timeToMinutes(shift.startTime) < timeToMinutes(previousShift.endTime)
      ) {
        throw new DomainError(
          'Turnos do mesmo dia da semana não podem se sobrepor.',
          ERROR_CODE.DADOS_INVALIDOS,
        )
      }
    })
  }

  private toConfiguration(shifts: ShiftDto[]): WorkScheduleConfiguration[] {
    const configuration: WorkScheduleConfiguration[] = []

    shifts.forEach((shift) => {
      let item = configuration.find(
        (config) =>
          config.weekDay === shift.weekDay &&
          config.duration === shift.slotDurationMinutes,
      )

      if (!item) {
        item = {
          weekDay: shift.weekDay,
          duration: shift.slotDurationMinutes,
          time: [],
        }
        configuration.push(item)
      }

      item.time.push({ startTime: shift.startTime, endTime: shift.endTime })
    })

    return configuration
  }

  private async ensureDoctorExists(doctorId: number): Promise<void> {
    const exists = await this.doctorRepository.existsBy({ id: doctorId })
    if (!exists) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
  }
}
