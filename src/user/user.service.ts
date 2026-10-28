import { Injectable } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { UserCreateDto } from './dto/user-create.dto'
import { User } from '../@common/entities/user'
import { UserResponseDto } from './dto/user-response.dto'
import { RoleService } from '../role/role.service'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { hashPassword } from '../@common/utils/hash-password'

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
  ) {}

  async get(id: number): Promise<User> {
    if (!id || isNaN(id)) {
      throw new DomainError(
        'Usuário não autenticado',
        ERROR_CODE.NAO_AUTENTICADO,
      )
    }

    const user = await this.userRepository.get(id)
    if (!user) {
      throw new DomainError(
        'Usuário não autenticado',
        ERROR_CODE.NAO_AUTENTICADO,
      )
    }

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.getUserByEmail(email)
  }

  async getMe(id: number): Promise<UserResponseDto> {
    return UserResponseDto.resultEntity(await this.get(id))
  }

  async create(dto: UserCreateDto): Promise<UserResponseDto> {
    const existsUser = await this.userRepository.getUserByEmail(dto.email)
    if (existsUser) {
      throw new DomainError(
        'E-mail já cadastrado.',
        ERROR_CODE.EMAIL_JA_CADASTRADO,
      )
    }

    const roles = await this.roleService.getByNames(dto.roles)

    const user = await this.userRepository.register({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      roles,
    })

    return UserResponseDto.resultEntity(user)
  }
}
