import { describe, expect, it, vi } from 'vitest'
import { Role, RoleName } from '../../@common/entities/role'
import { RoleRepository } from '../role.repository'
import { RoleService } from '../role.service'

describe(RoleService.name, () => {
  it('busca os perfis pelos nomes', async () => {
    const roles = [{ name: RoleName.ADMIN } as Role]
    const find = vi.fn<RoleRepository['find']>().mockResolvedValue(roles)
    const roleService = new RoleService({ find } as unknown as RoleRepository)

    await expect(roleService.getByNames([RoleName.ADMIN])).resolves.toBe(roles)
    expect(find).toHaveBeenCalledTimes(1)
  })
})
