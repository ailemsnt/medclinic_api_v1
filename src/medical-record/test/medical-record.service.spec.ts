import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { AuthUserDto } from '../../@common/dto/auth-user.dto'
import { MedicalRecord } from '../../@common/entities/medical-record'
import { RoleName } from '../../@common/entities/role'
import { ERROR_CODE } from '../../@common/errors/domain.error'
import { AppointmentRepository } from '../../appointment/appointment.repository'
import { Doctor } from '../../doctor/doctor.entity'
import { DoctorRepository } from '../../doctor/doctor.repository'
import { MedicalRecordRepository } from '../medical-record.repository'
import { MedicalRecordService } from '../medical-record.service'

const DOCTOR_ID = 3
const PATIENT_ID = 10
const pagination = { page: 1, pageSize: 20 }

function buildUser(roles: RoleName[]): AuthUserDto {
  return { sub: '7', data: { roles } }
}

describe(MedicalRecordService.name, () => {
  let medicalRecordService: MedicalRecordService
  let patientExists: Mock<MedicalRecordRepository['patientExists']>
  let createMedicalRecord: Mock<MedicalRecordRepository['createMedicalRecord']>
  let findByPatient: Mock<MedicalRecordRepository['findByPatient']>
  let hasClinicalLink: Mock<AppointmentRepository['hasClinicalLink']>
  let findDoctorByUserId: Mock<DoctorRepository['findByUserId']>

  beforeEach(() => {
    patientExists = vi
      .fn<MedicalRecordRepository['patientExists']>()
      .mockResolvedValue(true)
    createMedicalRecord = vi
      .fn<MedicalRecordRepository['createMedicalRecord']>()
      .mockImplementation((input) =>
        Promise.resolve({
          id: 5,
          ...input,
          createdAt: new Date('2026-10-13T11:25:00Z'),
        } as MedicalRecord),
      )
    findByPatient = vi
      .fn<MedicalRecordRepository['findByPatient']>()
      .mockResolvedValue([[], 0])
    hasClinicalLink = vi
      .fn<AppointmentRepository['hasClinicalLink']>()
      .mockResolvedValue(true)
    findDoctorByUserId = vi
      .fn<DoctorRepository['findByUserId']>()
      .mockResolvedValue({ id: DOCTOR_ID } as Doctor)

    medicalRecordService = new MedicalRecordService(
      {
        patientExists,
        createMedicalRecord,
        findByPatient,
      } as unknown as MedicalRecordRepository,
      { hasClinicalLink } as unknown as AppointmentRepository,
      { findByUserId: findDoctorByUserId } as unknown as DoctorRepository,
    )
  })

  describe('create', () => {
    it('médico com vínculo escreve, com doctorId vindo do token', async () => {
      const result = await medicalRecordService.create(
        PATIENT_ID,
        { text: 'Paciente relata dor lombar.', doctorId: 999 },
        buildUser([RoleName.DOCTOR]),
      )

      expect(result).toMatchObject({
        id: 5,
        patientId: PATIENT_ID,
        doctorId: DOCTOR_ID,
      })
      expect(hasClinicalLink).toHaveBeenCalledWith(DOCTOR_ID, PATIENT_ID)
    })

    it('médico sem vínculo recebe 403', async () => {
      hasClinicalLink.mockResolvedValue(false)

      await expect(
        medicalRecordService.create(
          PATIENT_ID,
          { text: 'Texto' },
          buildUser([RoleName.DOCTOR]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
      expect(createMedicalRecord).not.toHaveBeenCalled()
    })

    it.each([[RoleName.ADMIN], [RoleName.SECRETARY]])(
      'perfil %s não escreve',
      async (role) => {
        await expect(
          medicalRecordService.create(
            PATIENT_ID,
            { text: 'Texto' },
            buildUser([role]),
          ),
        ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
      },
    )

    it('usuário doctor sem cadastro de médico recebe 403', async () => {
      findDoctorByUserId.mockResolvedValue(null)

      await expect(
        medicalRecordService.create(
          PATIENT_ID,
          { text: 'Texto' },
          buildUser([RoleName.DOCTOR]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })

    it('paciente inexistente devolve 404', async () => {
      patientExists.mockResolvedValue(false)

      await expect(
        medicalRecordService.create(
          PATIENT_ID,
          { text: 'Texto' },
          buildUser([RoleName.DOCTOR]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.RECURSO_NAO_ENCONTRADO })
    })
  })

  describe('findByPatient', () => {
    it('admin lê sem vínculo, para auditoria', async () => {
      const result = await medicalRecordService.findByPatient(
        PATIENT_ID,
        pagination,
        buildUser([RoleName.ADMIN]),
      )

      expect(result.meta.total).toBe(0)
      expect(hasClinicalLink).not.toHaveBeenCalled()
    })

    it('médico com vínculo lê', async () => {
      findByPatient.mockResolvedValue([
        [
          {
            id: 5,
            patientId: PATIENT_ID,
            doctorId: DOCTOR_ID,
          } as MedicalRecord,
        ],
        1,
      ])

      const result = await medicalRecordService.findByPatient(
        PATIENT_ID,
        pagination,
        buildUser([RoleName.DOCTOR]),
      )

      expect(result.data).toHaveLength(1)
    })

    it('médico sem vínculo recebe 403', async () => {
      hasClinicalLink.mockResolvedValue(false)

      await expect(
        medicalRecordService.findByPatient(
          PATIENT_ID,
          pagination,
          buildUser([RoleName.DOCTOR]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })

    it('secretária recebe 403', async () => {
      await expect(
        medicalRecordService.findByPatient(
          PATIENT_ID,
          pagination,
          buildUser([RoleName.SECRETARY]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })
  })
})
