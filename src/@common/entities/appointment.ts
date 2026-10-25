import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export const APPOINTMENT_STATUS = {
  scheduled: 'scheduled',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
}
export type APPOINTMENT_STATUS =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS]

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('bigint')
  patientId!: number

  @Column('bigint')
  doctorId!: number

  @Column('timestamptz')
  date!: Date

  @Column('integer')
  duration!: number

  @Column('enum', {
    enum: APPOINTMENT_STATUS,
  })
  status!: APPOINTMENT_STATUS
}
