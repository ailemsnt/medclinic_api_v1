import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { Role, RoleName } from '../../@common/entities/role'
import { User } from '../../@common/entities/user'
import { UserService } from '../user.service'
import { UserRepository } from '../user.repository'
import { RoleService } from '../../role/role.service'
import { ERROR_CODE } from '../../@common/errors/domain.error'

vi.mock('../../@common/utils/hash-password', () => ({
  hashPassword: (password: string) => Promise.resolve(`hashed-${password}`),
}))

const secretaryRole = { name: RoleName.SECRETARY } as Role

function buildUser(): User {
  return {
    id: 2,
    name: 'Joana Secretária',
    email: 'joana@medclinic.com',
    passwordHash: 'hashed-SenhaForte@123',
    roles: [secretaryRole],
  } as User
}

describe(UserService.name, () => {
  let userService: UserService
  let get: Mock<UserRepository['get']>
  let getUserByEmail: Mock<UserRepository['getUserByEmail']>
  let register: Mock<UserRepository['register']>
  let getByNames: Mock<RoleService['getByNames']>

  beforeEach(() => {
    get = vi.fn<UserRepository['get']>().mockResolvedValue(buildUser())
    getUserByEmail = vi
      .fn<UserRepository['getUserByEmail']>()
      .mockResolvedValue(null)
    register = vi
      .fn<UserRepository['register']>()
      .mockImplementation((input) =>
        Promise.resolve({ id: 2, ...input } as User),
      )
    getByNames = vi
      .fn<RoleService['getByNames']>()
      .mockResolvedValue([secretaryRole])

    userService = new UserService(
      { get, getUserByEmail, register } as unknown as UserRepository,
      { getByNames } as unknown as RoleService,
    )
  })

  it('getMe devolve o usuário com os nomes dos perfis e sem senha', async () => {
    await expect(userService.getMe(2)).resolves.toEqual({
      id: 2,
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      roles: [RoleName.SECRETARY],
    })
  })

  it('get recusa id inválido e usuário inexistente com 401', async () => {
    await expect(userService.get(Number('abc'))).rejects.toMatchObject({
      code: ERROR_CODE.NAO_AUTENTICADO,
    })

    get.mockResolvedValue(null)
    await expect(userService.get(2)).rejects.toMatchObject({
      code: ERROR_CODE.NAO_AUTENTICADO,
    })
  })

  it('getUserByEmail repassa a busca ao repositório', async () => {
    await expect(userService.getUserByEmail('nao@mail.com')).resolves.toBeNull()
    expect(getUserByEmail).toHaveBeenCalledWith('nao@mail.com')
  })

  it('cria usuário com os perfis pedidos e a senha em hash', async () => {
    const result = await userService.create({
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      password: 'SenhaForte@123',
      roles: [RoleName.SECRETARY],
    })

    expect(result).toEqual({
      id: 2,
      name: 'Joana Secretária',
      email: 'joana@medclinic.com',
      roles: [RoleName.SECRETARY],
    })
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed-SenhaForte@123' }),
    )
  })

  it('recusa e-mail repetido com 409', async () => {
    getUserByEmail.mockResolvedValue(buildUser())

    await expect(
      userService.create({
        name: 'Joana Secretária',
        email: 'joana@medclinic.com',
        password: 'SenhaForte@123',
        roles: [RoleName.SECRETARY],
      }),
    ).rejects.toMatchObject({ code: ERROR_CODE.EMAIL_JA_CADASTRADO })
    expect(register).not.toHaveBeenCalled()
  })
})