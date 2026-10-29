import { Injectable } from '@nestjs/common'
import { JwtService } from './jwt/jwt.service'
import { compare } from 'bcrypt'
import { AuthLoginDto } from './dto/auth-login.dto'
import { UserService } from '../user/user.service'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async login(loginDto: AuthLoginDto) {
    const user = await this.userService.getUserByEmail(loginDto.email)

    const isPasswordValid =
      user !== null && (await compare(loginDto.password, user.passwordHash))

    if (!user || !isPasswordValid) {
      throw new DomainError(
        'E-mail ou senha inválidos.',
        ERROR_CODE.CREDENCIAIS_INVALIDAS,
      )
    }

    const accessToken = this.jwtService.sign(
      {
        roles: user.roles.map((role) => role.name),
      },
      user.id,
    )

    return { accessToken }
  }
}
