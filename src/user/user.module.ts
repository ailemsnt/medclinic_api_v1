import { Module } from '@nestjs/common';
import { JwtModule } from '../auth/jwt/jwt.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import {
  TYPEORM_USER_REPOSITORY,
  UserTypeOrmRepository,
} from './user-typeorm.repository';
import { User } from '../@common/entities/user.entity';
import { appDataSource } from '../@common/database/typeorm';

@Module({
  imports: [JwtModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository, // Quando pedir a porta
      useClass: UserTypeOrmRepository, // Usar a implementação
    },
    {
      provide: TYPEORM_USER_REPOSITORY,
      useFactory() {
        return appDataSource.getRepository(User);
      },
    },
  ],
  exports: [UserService],
})
export class UserModule {}
