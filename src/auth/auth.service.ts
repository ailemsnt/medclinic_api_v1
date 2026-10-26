import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from './jwt/jwt.service'
import { compare } from 'bcrypt'
import { AuthLoginDto } from './dto/auth-login.dto'
import { JWT_EXPIRES_IN } from '../@common/config/jwt.config'
import { UserService } from '../user/user.service'
import { AuthRegisterDto } from './dto/auth-register.dto'
import { AuthResponseDto } from './dto/auth-response.dto'
import { hashPassword } from '../@common/utils/hash-password'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(user: AuthRegisterDto): Promise<AuthResponseDto> {
    const existsUser = await this.userService.getUserByEmail(user.email)

    if (existsUser) {
      throw new ConflictException('Usuário já cadastrado')
    }

    const hashedPassword = await hashPassword(user.password)

    const registeredUser = await this.userService.register({
      ...user,
      password: hashedPassword,
    })

    return {
      ...registeredUser,
      roles: [registeredUser.roles.name], //TODO: ver user
    }
  }

  async login(loginDto: AuthLoginDto) {
    const user = await this.userService.getUserByEmail(loginDto.email)

    if (!user) {
      throw new UnauthorizedException()
    }

    if (!(await compare(loginDto.password, user.passwordHash))) {
      throw new UnauthorizedException()
    }

    const token = this.jwtService.sign(
      {
        roles: user.roles.map((role) => role.name), //TODO: ver assinatura
      },
      user.id,
    )

    return {
      token,
      user: user.id,
      role: user.roles, //TODO: ver role
      expiresIn: JWT_EXPIRES_IN,
    }
  }
}
