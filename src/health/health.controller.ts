import { Controller, Get } from '@nestjs/common'
import { PublicRoute } from '../@common/decorators/public-route.decorator'

@PublicRoute()
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'healthy',
    }
  }
}
