import { JwtPayload } from 'jsonwebtoken'
import { RoleName } from '../entities/role.entity'

export interface AuthUserDto extends JwtPayload {
  data: {
    roles: RoleName[]
  }
}
