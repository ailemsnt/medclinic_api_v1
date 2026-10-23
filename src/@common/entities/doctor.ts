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

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('varchar', { length: 255 })
  crm!: string

  @Column('number')
  userId!: number

  @JoinColumn({ name: 'user_id' })
  @OneToOne(() => User)
  user!: User

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => WorkSchedule, (workSchedule) => workSchedule.doctor)
  workSchedule!: WorkSchedule
}