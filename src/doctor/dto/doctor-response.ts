import { Doctor } from '../../@common/entities/doctor'

export class DoctorUserResponseDto {
  id!: number
  name!: string
  email!: string
  roles!: string[]
}

export class DoctorResponseDto {
  id!: number
  crm!: string
  user!: DoctorUserResponseDto

  static resultEntity(doctor: Doctor): DoctorResponseDto {
    return {
      id: doctor.id,
      crm: doctor.crm,
      user: {
        id: doctor.user.id,
        name: doctor.user.name,
        email: doctor.user.email,
        roles: doctor.user.roles.map((role) => role.name),
      },
    }
  }
}
