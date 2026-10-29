import { env } from './@common/config/env.config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api/v1')

  await app.listen(env.PORT, '0.0.0.0')
}

bootstrap().catch((err: unknown) => {
  console.error(err)
  process.exit(-1)
})
