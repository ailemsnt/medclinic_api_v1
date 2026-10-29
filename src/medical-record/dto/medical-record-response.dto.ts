import { MedicalRecord } from '../../@common/entities/medical-record'

export class MedicalRecordResponseDto {
  id!: number
  patientId!: number
  doctorId!: number
  text!: string
  createdAt!: Date

  static resultEntity(medicalRecord: MedicalRecord): MedicalRecordResponseDto {
    return {
      id: medicalRecord.id,
      patientId: medicalRecord.patientId,
      doctorId: medicalRecord.doctorId,
      text: medicalRecord.text,
      createdAt: medicalRecord.createdAt,
    }
  }
}
