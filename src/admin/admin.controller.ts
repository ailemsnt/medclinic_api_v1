import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../@common/guards/jwt.guard';
import { RequireRole } from '../@common/decorators/roles.decorator';
import { RoleName } from '../@common/entities/role.entity';

@Controller('admin')
export class AdminController {
  @Get('ping')
  @UseGuards(JwtGuard)
  @RequireRole([RoleName.ADMIN])
  ping() {
    return {
      message: 'Acesso permitido para ADMIN',
    };
  }
}
