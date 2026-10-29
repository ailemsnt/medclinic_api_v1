import { Body, Controller, Get, Post } from '@nestjs/common'
import { UserService } from './user.service'
import { GetUserJwt } from '../@common/decorators/get-user-jwt.decorator'
import type { AuthUserDto } from '../@common/dto/auth-user.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { RequireRole } from '../@common/decorators/roles.decorator'
import { RoleName } from '../@common/entities/role'
import { UserCreateDto } from './dto/user-create.dto'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@GetUserJwt() user: AuthUserDto): Promise<UserResponseDto> {
    return this.userService.getMe(Number(user.sub))
  }

  @Post()
  @RequireRole([RoleName.ADMIN])
  async create(@Body() dto: UserCreateDto): Promise<UserResponseDto> {
    return this.userService.create(dto)
  }
}
