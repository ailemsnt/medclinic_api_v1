import { SetMetadata } from '@nestjs/common'
import { RoleName } from '../entities/role'

export interface RequireRoleOptions {
  mode: 'some' | 'every'
}

export interface RoleMetadata {
  requiredRoles: string[]
  mode: 'some' | 'every'
}

export const ROLES_METADATA_KEY = 'REQUIRED_ROLES'

export const RequireRole = (
  roles: RoleName[],
  options: RequireRoleOptions = {
    mode: 'some',
  },
) =>
  SetMetadata(ROLES_METADATA_KEY, {
    requiredRoles: roles,
    mode: options.mode,
  })
