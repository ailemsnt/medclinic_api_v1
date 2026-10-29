import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { ERROR_CODE } from '../../@common/errors/domain.error'
import { Patient } from '../patient.entity'
import { PatientRepository } from '../patient.repository'
import { PatientService } from '../patient.service'

function buildPatient(): Patient {
  return {
    id: 10,
    name: 'Carlos Pereira',
    cpf: '12345678901',
    createdAt: new Date('2026-10-20T14:03:11Z'),
  } as Patient
}

describe(PatientService.name, () => {
  let patientService: PatientService
  let findByCpf: Mock<PatientRepository['findByCpf']>
  let createPatient: Mock<PatientRepository['createPatient']>
  let findById: Mock<PatientRepository['findById']>
  let findAll: Mock<PatientRepository['findAll']>
  let save: Mock<(patient: Patient) => Promise<Patient>>
  let softDelete: Mock<PatientRepository['softDelete']>

  beforeEach(() => {
    findByCpf = vi.fn<PatientRepository['findByCpf']>().mockResolvedValue(null)
    createPatient = vi
      .fn<PatientRepository['createPatient']>()
      .mockResolvedValue(buildPatient())
    findById = vi
      .fn<PatientRepository['findById']>()
      .mockImplementation(() => Promise.resolve(buildPatient()))
    findAll = vi
      .fn<PatientRepository['findAll']>()
      .mockResolvedValue([[buildPatient()], 1])
    save = vi.fn((patient: Patient) => Promise.resolve(patient))
    softDelete = vi.fn<PatientRepository['softDelete']>()

    patientService = new PatientService({
      findByCpf,
      createPatient,
      findById,
      findAll,
      save,
      softDelete,
    } as unknown as PatientRepository)
  })

  it('cadastra paciente', async () => {
    await expect(
      patientService.create({ name: 'Carlos Pereira', cpf: '12345678901' }),
    ).resolves.toEqual({
      id: 10,
      name: 'Carlos Pereira',
      cpf: '12345678901',
      createdAt: new Date('2026-10-20T14:03:11Z'),
    })
  })

  it('recusa CPF repetido com 409', async () => {
    findByCpf.mockResolvedValue(buildPatient())

    await expect(
      patientService.create({ name: 'Outro', cpf: '12345678901' }),
    ).rejects.toMatchObject({ code: ERROR_CODE.CPF_JA_CADASTRADO })
    expect(createPatient).not.toHaveBeenCalled()
  })

  it('lista com metadados de paginação', async () => {
    const result = await patientService.findAll({
      page: 1,
      pageSize: 20,
      name: 'car',
    })

    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })
    expect(findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20, name: 'car' })
  })

  it('busca por id e devolve 404 quando não existe', async () => {
    await expect(patientService.findById(10)).resolves.toMatchObject({ id: 10 })

    findById.mockResolvedValue(null)
    await expect(patientService.findById(99)).rejects.toMatchObject({
      code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
    })
  })

  it('altera o nome e mantém quando não é enviado', async () => {
    await expect(
      patientService.update(10, { name: 'Carlos P.' }),
    ).resolves.toMatchObject({ name: 'Carlos P.' })
    await expect(patientService.update(10, {})).resolves.toMatchObject({
      name: 'Carlos Pereira',
    })
  })

  it('remove com soft delete e devolve 404 quando não existe', async () => {
    await patientService.remove(10)
    expect(softDelete).toHaveBeenCalledWith({ id: 10 })

    findById.mockResolvedValue(null)
    await expect(patientService.remove(99)).rejects.toMatchObject({
      code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
    })
  })
})
