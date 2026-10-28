// import { expect, it, describe, beforeAll, jest } from '@jest/globals'
// import { UserService } from '../../user/user.service'
// import { AuthRegisterDto } from '../dto/auth-register.dto'
// import { User } from '../../@common/entities/user'
// import { AuthService } from '../auth.service'
// import { JwtService } from '../jwt/jwt.service'
// import { ConflictException, UnauthorizedException } from '@nestjs/common'
// import { AuthLoginDto } from '../dto/auth-login.dto'
// import { RoleName } from '../../@common/entities/role'

// class UserServiceMock implements Partial<UserService> {
//   private memoryDb = new Map<number, User>()

//   private idSequence = 0

//   async register(
//     user: Parameters<UserService['register']>[0],
//   ): Promise<Awaited<ReturnType<UserService['register']>>> {
//     //TODO: ver register
//     const userEntity = new User()
//     userEntity.id = ++this.idSequence
//     userEntity.name = user.name
//     userEntity.email = user.email
//     userEntity.passwordHash = user.password
//     userEntity.roles = [{ name: RoleName.SECRETARY } as User['roles'][number]] //TODO: ver role
//     userEntity.createdAt = new Date()

//     this.memoryDb.set(userEntity.id, userEntity)

//     return Promise.resolve({
//       id: userEntity.id,
//       name: userEntity.name,
//       email: userEntity.email,
//       roles: userEntity.roles[0], //TODO: ver entity
//       createdAt: userEntity.createdAt,
//     })
//   }

//   async getUserByEmail(email: string): Promise<User | null> {
//     for (const user of this.memoryDb.values()) {
//       if (user.email === email) {
//         return user
//       }
//     }
//     return Promise.resolve(null)
//   }
// }

// jest.mock('bcrypt', () => {
//   return {
//     genSalt: jest.fn<() => Promise<string>>().mockResolvedValue('salt'),
//     hash: jest.fn().mockImplementation((password) => {
//       return Promise.resolve(`hashed-${String(password)}`)
//     }),
//     compare: jest.fn().mockImplementation((password, hash) => {
//       return Promise.resolve(hash === `hashed-${String(password)}`)
//     }),
//   }
// })

// describe(AuthService.name, () => {
//   const userServiceMock = new UserServiceMock()
//   const userService = userServiceMock as unknown as UserService

//   beforeAll(async () => {
//     await userServiceMock.register({
//       name: 'Joao Maria',
//       email: 'joao@mail.com',
//       password: '123456',
//     })
//   })

//   describe('register', () => {
//     it('should register a new user', async () => {
//       const jwtServiceMock = {
//         sign: jest.fn().mockReturnValue('meutoken'),
//       } as unknown as JwtService

//       const service = new AuthService(jwtServiceMock, userService)

//       const dto: AuthRegisterDto = {
//         name: 'Joao Maria',
//         email: 'joaom@mail.com',
//         password: '123456',
//       }

//       const result = await service.register(dto)

//       expect(result).toEqual(
//         expect.objectContaining({
//           id: 2,
//           name: 'Joao Maria',
//           email: 'joaom@mail.com',
//         }),
//       )
//     })

//     it('should throw a conflict if user exists', async () => {
//       const jwtServiceMock = {
//         sign: jest.fn().mockReturnValue('meutoken'),
//       } as unknown as JwtService

//       const service = new AuthService(jwtServiceMock, userService)

//       const dto: AuthRegisterDto = {
//         name: 'Joao Maria',
//         email: 'joao@mail.com',
//         password: '123456',
//       }

//       const error = await service
//         .register(dto)
//         .catch((error) => error as ConflictException)

//       expect(error).toBeInstanceOf(ConflictException)
//     })
//   })

//   describe('login', () => {
//     it('should login a user', async () => {
//       const jwtServiceMock = {
//         sign: jest.fn().mockReturnValue('meutoken'),
//       } as unknown as JwtService

//       const service = new AuthService(jwtServiceMock, userService)

//       const dto: AuthLoginDto = {
//         email: 'joaom@mail.com',
//         password: '123456',
//       }

//       const result = await service.login(dto)

//       expect(result).toEqual({
//         token: 'meutoken',
//         user: 2,
//         roles: [RoleName.SECRETARY],
//         expiresIn: expect.anything(),
//       })
//     })

//     it('should throw a unauthorized user if not exists', async () => {
//       const jwtServiceMock = {
//         sign: jest.fn().mockReturnValue('meutoken'),
//       } as unknown as JwtService

//       const service = new AuthService(jwtServiceMock, userService)

//       const dto: AuthLoginDto = {
//         email: 'joao1@mail.com',
//         password: '123456',
//       }

//       const error = await service
//         .login(dto)
//         .catch((error) => error as UnauthorizedException)

//       expect(error).toBeInstanceOf(UnauthorizedException)
//     })

//     it('should throw a unauthorized password is invalid', async () => {
//       const jwtServiceMock = {
//         sign: jest.fn().mockReturnValue('token'),
//       } as unknown as JwtService

//       const service = new AuthService(jwtServiceMock, userService)

//       const dto: AuthLoginDto = {
//         email: 'joao@mail.com',
//         password: '1234576',
//       }

//       const error = await service
//         .login(dto)
//         .catch((error) => error as UnauthorizedException)

//       expect(error).toBeInstanceOf(UnauthorizedException)
//     })
//   })
// })
