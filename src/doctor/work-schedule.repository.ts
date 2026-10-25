import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { WorkSchedule } from '../@common/entities/work-schedule'

@Injectable()
export class WorkScheduleRepository extends Repository<WorkSchedule> {}
