import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class AuthResponseDto {
  @Expose()
  id!: number

  @Expose()
  name!: string

  @Expose()
  email!: string

  @Expose()
  roles!: string[]

  @Expose()
  createdAt!: Date

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial)
  }
}
