import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthLoginDto } from './dto/auth-login.dto'
import { AuthService } from './auth.service'
import { PublicRoute } from '../@common/decorators/public-route.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthLoginDto) {
    return this.authService.login(loginDto)
  }
}
