import { Patient } from '../patient.entity'

export class PatientResponseDto {
  id!: number
  name!: string
  cpf!: string
  createdAt!: Date

  static resultEntity(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      createdAt: patient.createdAt,
    }
  }
}
