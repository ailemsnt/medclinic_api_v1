import { Injectable } from '@nestjs/common'
import { In } from 'typeorm'

import { RoleRepository } from './role.repository'
import { RoleName } from '../@common/entities/role'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  getByNames(names: RoleName[]) {
    return this.roleRepository.find({
      where: { name: In(names) },
    })
  }
}
