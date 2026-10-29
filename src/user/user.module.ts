import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'
import { User } from '../@common/entities/user'
import { typeOrmRepositoryFactory } from '../@common/database/typeorm'
import { RoleModule } from '../role/role.module'

@Module({
  imports: [RoleModule],
  controllers: [UserController],
  providers: [UserService, typeOrmRepositoryFactory(UserRepository, User)],
  exports: [UserService],
})
export class UserModule {}
