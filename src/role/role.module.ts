import { Module } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { Role } from '../@common/entities/role'
import { RoleRepository } from './role.repository'
import { RoleService } from './role.service'

@Module({
  providers: [
    {
      provide: RoleRepository,
      useFactory(dataSource: DataSource) {
        return new RoleRepository(Role, dataSource.manager)
      },
      inject: [DataSource],
    },
    RoleService,
  ],
  exports: [RoleService],
})
export class RoleModule {}
