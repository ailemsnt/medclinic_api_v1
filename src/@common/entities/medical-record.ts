import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Patient } from '../../patient/patient.entity'
import { Doctor } from '../../doctor/doctor.entity'

@Index(['patientId', 'createdAt'])
@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number

  @Column('text')
  text!: string

  @Column('int')
  patientId!: number

  @JoinColumn({ name: 'patient_id' })
  @ManyToOne(() => Patient)
  patient!: Patient

  @Column('int')
  doctorId!: number

  @JoinColumn({ name: 'doctor_id' })
  @ManyToOne(() => Doctor)
  doctor!: Doctor

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
