import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Doctor } from '../@common/entities/doctor'

export interface DoctorCreateInput {
  name: string;
  email: string;
  passwordHash: string;
  crm: string;
}

export interface DoctorFindFilter {
  page: number;
  pageSize: number;
  name?: string;
}
@Injectable()
export abstract class DoctorRepository extends Repository<Doctor> {
  abstract createWithUser(input: DoctorCreateInput): Promise<Doctor>;

  abstract findById(id: number): Promise<Doctor | null>;
  
  abstract findByCrm(crm: string): Promise<Doctor | null>;

  abstract findAll(filter: DoctorFindFilter): Promise<[Doctor[], number]>;
  
}