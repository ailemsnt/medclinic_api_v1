import { JwtPayload } from 'jsonwebtoken'
import { RoleName } from '../entities/role'

export interface AuthUserDto extends JwtPayload {
  data: {
    roles: RoleName[]
  }
}
