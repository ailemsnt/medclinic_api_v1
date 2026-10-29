import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { WorkSchedule, WorkScheduleConfiguration } from './work-schedule.entity'

@Injectable()
export class WorkScheduleRepository extends Repository<WorkSchedule> {
  async findByDoctorId(doctorId: number): Promise<WorkSchedule | null> {
    return this.findOne({ where: { doctorId } })
  }

  async replaceConfiguration(
    doctorId: number,
    configuration: WorkScheduleConfiguration[],
  ): Promise<void> {
    await this.upsert({ doctorId, configuration }, ['doctorId'])
  }
}
