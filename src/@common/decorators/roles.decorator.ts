import { SetMetadata } from '@nestjs/common';
import { Roles } from '../entities/enums/roles.enum';

export const ROLES_KEY = 'roles';

export interface RequireRoleOptions {
  mode: 'some' | 'every'
}

export interface RoleMetadata {
  requiredRoles: string[]
  mode: 'some' | 'every'
}

export const ROLES_METADATA_KEY = 'REQUIRED_ROLES'

export const RequireRole = (
  roles: Roles[],
  options: RequireRoleOptions = {
    mode: 'some',
  },
) =>
  SetMetadata(ROLES_METADATA_KEY, {
    requiredRoles: roles,
    mode: options.mode,
  })

// export const RolesAllowed = (...roles: Roles[]) =>
//   SetMetadata(ROLES_KEY, roles);
