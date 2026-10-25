import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

import { WorkSchedule } from './work-schedule'
import { User } from './user.entity'

@Entity('doctor')
export class Doctor {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('varchar', { length: 20, unique: true })
  crm!: string

  @Column('number')
  userId!: number

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User

  @CreateDateColumn({ type: 'timestamptz'})
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz'})
  updatedAt!: Date;

  @OneToOne(() => WorkSchedule, (workSchedule) => workSchedule.doctor)
  workSchedule!: WorkSchedule
}