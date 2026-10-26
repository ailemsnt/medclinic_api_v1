import { Injectable } from '@nestjs/common'
import { In } from 'typeorm'

import { RoleRepository } from './role.repository'
import { RoleName } from '../@common/entities/role'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async getAdmin() {
    return await this.roleRepository.findOneOrFail({
      where: { name: RoleName.ADMIN },
    })
  }

  async getUser() {
    return await this.roleRepository.findOneOrFail({
      where: { name: RoleName.USER },
    })
  }

  getByNames(names: RoleName[]) {
    return this.roleRepository.find({
      where: { name: In(names) },
    })
  }
}
