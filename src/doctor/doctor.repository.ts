import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'

import { Doctor } from '../@common/entities/doctor'

@Injectable()
export class DoctorRepository extends Repository<Doctor> {}