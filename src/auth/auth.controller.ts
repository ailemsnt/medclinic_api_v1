import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { PublicRoute } from '../@common/decorators/public-route.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: AuthRegisterDto) {
    return this.authService.register(registerDto);
  }

  @PublicRoute()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthLoginDto) {
    return this.authService.login(loginDto);
  }
}
