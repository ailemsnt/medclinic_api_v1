import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Patient } from '../../patient/patient.entity'

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('text')
  text!: string

  @Column('bigint')
  patientId!: number

  @JoinColumn({ name: 'patient_id' })
  @OneToOne(() => Patient)
  patient!: Patient
}
