import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { Role, RoleName } from '../../@common/entities/role'
import { User } from '../../@common/entities/user'
import { ERROR_CODE } from '../../@common/errors/domain.error'
import { UserService } from '../../user/user.service'
import { Doctor } from '../doctor.entity'
import { DoctorRepository } from '../doctor.repository'
import { DoctorService } from '../doctor.service'

vi.mock('../../@common/utils/hash-password', () => ({
  hashPassword: (password: string) => Promise.resolve(`hashed-${password}`),
}))

function buildDoctor(): Doctor {
  return {
    id: 3,
    crm: 'CRM-SC-54321',
    user: {
      id: 7,
      name: 'Dra. Helena Souza',
      email: 'helena@medclinic.com',
      roles: [{ name: RoleName.DOCTOR } as Role],
    } as User,
  } as Doctor
}

const doctorResponse = {
  id: 3,
  crm: 'CRM-SC-54321',
  user: {
    id: 7,
    name: 'Dra. Helena Souza',
    email: 'helena@medclinic.com',
    roles: [RoleName.DOCTOR],
  },
}

describe(DoctorService.name, () => {
  let doctorService: DoctorService
  let createDoctorWithUser: Mock<DoctorRepository['createDoctorWithUser']>
  let findById: Mock<DoctorRepository['findById']>
  let findByCrm: Mock<DoctorRepository['findByCrm']>
  let findAll: Mock<DoctorRepository['findAll']>
  let getUserByEmail: Mock<UserService['getUserByEmail']>

  const dto = {
    name: 'Dra. Helena Souza',
    email: 'helena@medclinic.com',
    password: 'SenhaForte@123',
    crm: 'CRM-SC-54321',
  }

  beforeEach(() => {
    createDoctorWithUser = vi
      .fn<DoctorRepository['createDoctorWithUser']>()
      .mockResolvedValue(buildDoctor())
    findById = vi
      .fn<DoctorRepository['findById']>()
      .mockResolvedValue(buildDoctor())
    findByCrm = vi.fn<DoctorRepository['findByCrm']>().mockResolvedValue(null)
    findAll = vi
      .fn<DoctorRepository['findAll']>()
      .mockResolvedValue([[buildDoctor()], 1])
    getUserByEmail = vi
      .fn<UserService['getUserByEmail']>()
      .mockResolvedValue(null)

    doctorService = new DoctorService(
      {
        createDoctorWithUser,
        findById,
        findByCrm,
        findAll,
      } as unknown as DoctorRepository,
      { getUserByEmail } as unknown as UserService,
    )
  })

  it('cria médico e usuário com a senha em hash', async () => {
    await expect(doctorService.create(dto)).resolves.toEqual(doctorResponse)
    expect(createDoctorWithUser).toHaveBeenCalledWith({
      name: dto.name,
      email: dto.email,
      passwordHash: 'hashed-SenhaForte@123',
      crm: dto.crm,
    })
  })

  it('recusa e-mail repetido com 409', async () => {
    getUserByEmail.mockResolvedValue(new User())

    await expect(doctorService.create(dto)).rejects.toMatchObject({
      code: ERROR_CODE.EMAIL_JA_CADASTRADO,
    })
    expect(createDoctorWithUser).not.toHaveBeenCalled()
  })

  it('recusa CRM repetido com 409', async () => {
    findByCrm.mockResolvedValue(buildDoctor())

    await expect(doctorService.create(dto)).rejects.toMatchObject({
      code: ERROR_CODE.CRM_JA_CADASTRADO,
    })
    expect(createDoctorWithUser).not.toHaveBeenCalled()
  })

  it('busca por id e devolve 404 quando não existe', async () => {
    await expect(doctorService.findById(3)).resolves.toEqual(doctorResponse)

    findById.mockResolvedValue(null)
    await expect(doctorService.findById(99)).rejects.toMatchObject({
      code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
    })
  })

  it('busca por CRM e devolve 404 quando não existe', async () => {
    findByCrm.mockResolvedValue(buildDoctor())
    await expect(doctorService.findByCrm('CRM-SC-54321')).resolves.toEqual(
      doctorResponse,
    )

    findByCrm.mockResolvedValue(null)
    await expect(doctorService.findByCrm('CRM-X')).rejects.toMatchObject({
      code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
    })
  })

  it('lista com metadados de paginação', async () => {
    const result = await doctorService.findAll({ page: 1, pageSize: 20 })

    expect(result).toEqual({
      data: [doctorResponse],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    })
  })
})