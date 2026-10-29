import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const
export type APPOINTMENT_STATUS =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS]

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('integer')
  patientId!: number

  @Column('integer')
  doctorId!: number

  @Column('timestamptz')
  startsAt!: Date

  @Column('timestamptz')
  endsAt!: Date

  @Column('enum', {
    enum: APPOINTMENT_STATUS,
  })
  status!: APPOINTMENT_STATUS
}
