import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../@common/entities/role.entity';

@Exclude()
export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  roles!: Role;

  @Expose()
  createdAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
