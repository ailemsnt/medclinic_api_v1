import { User } from '../../@common/entities/user'

export class UserResponseDto {
  id!: number
  name!: string
  email!: string
  roles!: string[]

  static resultEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map((role) => role.name),
    }
  }
}
