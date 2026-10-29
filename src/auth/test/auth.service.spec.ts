import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { compare } from 'bcrypt'
import { User } from '../../@common/entities/user'
import { Role, RoleName } from '../../@common/entities/role'
import { AuthService } from '../auth.service'
import { JwtService } from '../jwt/jwt.service'
import { UserService } from '../../user/user.service'
import { ERROR_CODE } from '../../@common/errors/domain.error'

vi.mock('../jwt/jwt.service', () => ({ JwtService: class {} }))

vi.mock('bcrypt', () => ({
  compare: vi.fn((password: string, passwordHash: string) =>
    Promise.resolve(passwordHash === `hashed-${password}`),
  ),
}))

function buildSecretaryUser(): User {
  const secretaryRole = new Role()
  secretaryRole.name = RoleName.SECRETARY

  const user = new User()
  user.id = 1
  user.email = 'joana@mail.com'
  user.passwordHash = 'hashed-SenhaForte@123'
  user.roles = [secretaryRole]
  return user
}

describe(AuthService.name, () => {
  let authService: AuthService
  let sign: Mock<JwtService['sign']>
  let getUserByEmail: Mock<UserService['getUserByEmail']>

  beforeEach(() => {
    vi.clearAllMocks()
    sign = vi.fn<JwtService['sign']>().mockReturnValue('meutoken')
    getUserByEmail = vi.fn<UserService['getUserByEmail']>()

    authService = new AuthService(
      { sign } as unknown as JwtService,
      { getUserByEmail } as unknown as UserService,
    )
  })

  it('devolve accessToken com os perfis quando a credencial é válida', async () => {
    getUserByEmail.mockResolvedValue(buildSecretaryUser())

    const result = await authService.login({
      email: 'joana@mail.com',
      password: 'SenhaForte@123',
    })

    expect(result).toEqual({ accessToken: 'meutoken' })
    expect(compare).toHaveBeenCalledWith(
      'SenhaForte@123',
      'hashed-SenhaForte@123',
    )
    expect(sign).toHaveBeenCalledWith({ roles: [RoleName.SECRETARY] }, 1)
  })

  it('recusa e-mail inexistente com CREDENCIAIS_INVALIDAS', async () => {
    getUserByEmail.mockResolvedValue(null)

    await expect(
      authService.login({ email: 'nao@mail.com', password: 'SenhaForte@123' }),
    ).rejects.toMatchObject({ code: ERROR_CODE.CREDENCIAIS_INVALIDAS })
    expect(compare).not.toHaveBeenCalled()
  })

  it('recusa senha errada comparando pelo hash, com o mesmo erro', async () => {
    getUserByEmail.mockResolvedValue(buildSecretaryUser())

    await expect(
      authService.login({ email: 'joana@mail.com', password: 'Errada@123' }),
    ).rejects.toMatchObject({ code: ERROR_CODE.CREDENCIAIS_INVALIDAS })
    expect(compare).toHaveBeenCalledWith('Errada@123', 'hashed-SenhaForte@123')
    expect(sign).not.toHaveBeenCalled()
  })
})
