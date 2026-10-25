import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Doctor } from './doctor'

export class WorkScheduleConfiguration {
  weekDay!: number // 0-6

  duration!: number // in minutes

  time!: {
    startTime: string // HH:MM
    endTime: string // HH:MM
  }[]
}

@Entity()
export class WorkSchedule {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column('number')
  doctorId!: number;

  @Column('jsonb')
  configuration!: WorkScheduleConfiguration[];

  @JoinColumn({ name: 'doctor_id' })
  @OneToOne(() => Doctor)
  doctor!: Doctor;
}