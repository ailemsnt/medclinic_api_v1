import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { AuthUserDto } from '../../@common/dto/auth-user.dto'
import {
  Appointment,
  APPOINTMENT_STATUS,
} from '../../@common/entities/appointment'
import { RoleName } from '../../@common/entities/role'
import { ERROR_CODE } from '../../@common/errors/domain.error'
import { Doctor } from '../../doctor/doctor.entity'
import { DoctorRepository } from '../../doctor/doctor.repository'
import { WorkSchedule } from '../../doctor/work-schedule.entity'
import { WorkScheduleRepository } from '../../doctor/work-schedule.repository'
import {
  AppointmentRepository,
  AppointmentTransaction,
} from '../appointment.repository'
import { AppointmentService, periodsOverlap } from '../appointment.service'

const DOCTOR_ID = 3
const OTHER_DOCTOR_ID = 4
const PATIENT_ID = 10

/** Terça (weekDay 2), 08:00 às 12:00 no horário da clínica, consultas de 30 min. */
function buildWorkSchedule(endTime = '12:00'): WorkSchedule {
  return {
    doctorId: DOCTOR_ID,
    configuration: [
      { weekDay: 2, duration: 30, time: [{ startTime: '08:00', endTime }] },
    ],
  } as WorkSchedule
}

function buildAppointment(
  startsAt: string,
  endsAt: string,
  status: APPOINTMENT_STATUS = APPOINTMENT_STATUS.SCHEDULED,
): Appointment {
  return {
    id: 41,
    doctorId: DOCTOR_ID,
    patientId: PATIENT_ID,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    status,
  }
}

function buildUser(roles: RoleName[], userId = 7): AuthUserDto {
  return { sub: String(userId), data: { roles } }
}

describe('periodsOverlap', () => {
  const existing = {
    startsAt: new Date('2026-10-13T10:00:00Z'),
    endsAt: new Date('2026-10-13T10:30:00Z'),
  }
  const period = (startsAt: string, endsAt: string) => ({
    startsAt: new Date(`2026-10-13T${startsAt}:00Z`),
    endsAt: new Date(`2026-10-13T${endsAt}:00Z`),
  })

  it('um antes do outro não conflita', () => {
    expect(periodsOverlap(period('09:00', '09:30'), existing)).toBe(false)
  })

  it('um depois do outro não conflita', () => {
    expect(periodsOverlap(period('11:00', '11:30'), existing)).toBe(false)
  })

  it('encostados não conflitam, nos dois sentidos', () => {
    expect(periodsOverlap(period('09:30', '10:00'), existing)).toBe(false)
    expect(periodsOverlap(period('10:30', '11:00'), existing)).toBe(false)
  })

  it('um dentro do outro conflita', () => {
    expect(periodsOverlap(period('10:10', '10:20'), existing)).toBe(true)
    expect(periodsOverlap(period('09:00', '11:00'), existing)).toBe(true)
  })

  it('cruzando a borda conflita', () => {
    expect(periodsOverlap(period('10:20', '10:50'), existing)).toBe(true)
    expect(periodsOverlap(period('09:50', '10:10'), existing)).toBe(true)
  })
})

describe(AppointmentService.name, () => {
  let appointmentService: AppointmentService

  let patientExists: Mock<AppointmentRepository['patientExists']>
  let runInTransaction: Mock<
    (
      work: (transaction: AppointmentTransaction) => Promise<Appointment>,
    ) => Promise<Appointment>
  >
  let findById: Mock<AppointmentRepository['findById']>
  let updateStatus: Mock<AppointmentRepository['updateStatus']>
  let findAll: Mock<AppointmentRepository['findAll']>
  let findActiveByDoctorInPeriod: Mock<
    AppointmentRepository['findActiveByDoctorInPeriod']
  >
  let findDoctorById: Mock<DoctorRepository['findById']>
  let findDoctorByUserId: Mock<DoctorRepository['findByUserId']>
  let findByDoctorId: Mock<WorkScheduleRepository['findByDoctorId']>

  let lockDoctor: Mock<AppointmentTransaction['lockDoctor']>
  let findWorkSchedule: Mock<AppointmentTransaction['findWorkSchedule']>
  let findActiveInPeriod: Mock<AppointmentTransaction['findActiveInPeriod']>
  let createAppointment: Mock<AppointmentTransaction['createAppointment']>

  let doctorAppointments: Appointment[]
  let patientAppointments: Appointment[]

  beforeEach(() => {
    doctorAppointments = []
    patientAppointments = []

    lockDoctor = vi
      .fn<AppointmentTransaction['lockDoctor']>()
      .mockResolvedValue(true)
    findWorkSchedule = vi
      .fn<AppointmentTransaction['findWorkSchedule']>()
      .mockResolvedValue(buildWorkSchedule())
    findActiveInPeriod = vi
      .fn<AppointmentTransaction['findActiveInPeriod']>()
      .mockImplementation((participant) =>
        Promise.resolve(
          'doctorId' in participant ? doctorAppointments : patientAppointments,
        ),
      )
    createAppointment = vi
      .fn<AppointmentTransaction['createAppointment']>()
      .mockImplementation((input) =>
        Promise.resolve({
          id: 41,
          ...input,
          status: APPOINTMENT_STATUS.SCHEDULED,
        }),
      )

    patientExists = vi
      .fn<AppointmentRepository['patientExists']>()
      .mockResolvedValue(true)
    runInTransaction = vi.fn((work) =>
      work({
        lockDoctor,
        findWorkSchedule,
        findActiveInPeriod,
        createAppointment,
      }),
    )
    findById = vi.fn<AppointmentRepository['findById']>()
    updateStatus = vi
      .fn<AppointmentRepository['updateStatus']>()
      .mockResolvedValue(true)
    findAll = vi
      .fn<AppointmentRepository['findAll']>()
      .mockResolvedValue([[], 0])
    findActiveByDoctorInPeriod = vi
      .fn<AppointmentRepository['findActiveByDoctorInPeriod']>()
      .mockResolvedValue([])
    findDoctorById = vi
      .fn<DoctorRepository['findById']>()
      .mockResolvedValue({ id: DOCTOR_ID } as Doctor)
    findDoctorByUserId = vi
      .fn<DoctorRepository['findByUserId']>()
      .mockResolvedValue({ id: DOCTOR_ID } as Doctor)
    findByDoctorId = vi
      .fn<WorkScheduleRepository['findByDoctorId']>()
      .mockResolvedValue(buildWorkSchedule())

    appointmentService = new AppointmentService(
      {
        patientExists,
        runInTransaction,
        findById,
        updateStatus,
        findAll,
        findActiveByDoctorInPeriod,
      } as unknown as AppointmentRepository,
      {
        findById: findDoctorById,
        findByUserId: findDoctorByUserId,
      } as unknown as DoctorRepository,
      { findByDoctorId } as unknown as WorkScheduleRepository,
    )
  })

  describe('create', () => {
    const createAt = (startsAt: string) =>
      appointmentService.create({
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        startsAt,
      })

    it('cria a consulta e calcula endsAt pela duração do turno', async () => {
      const result = await createAt('2026-10-13T08:00:00-03:00')

      expect(result).toEqual({
        id: 41,
        doctorId: DOCTOR_ID,
        patientId: PATIENT_ID,
        startsAt: new Date('2026-10-13T11:00:00.000Z'),
        endsAt: new Date('2026-10-13T11:30:00.000Z'),
        status: APPOINTMENT_STATUS.SCHEDULED,
      })
      expect(lockDoctor).toHaveBeenCalledWith(DOCTOR_ID)
    })

    it('aceita consulta encostada em outra do médico', async () => {
      doctorAppointments = [
        buildAppointment('2026-10-13T10:30:00Z', '2026-10-13T11:00:00Z'),
      ]

      await expect(
        createAt('2026-10-13T08:00:00-03:00'),
      ).resolves.toMatchObject({ status: APPOINTMENT_STATUS.SCHEDULED })
    })

    it('recusa paciente inexistente com 404 antes de abrir a transação', async () => {
      patientExists.mockResolvedValue(false)

      await expect(createAt('2026-10-13T08:00:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
        },
      )
      expect(runInTransaction).not.toHaveBeenCalled()
    })

    it('recusa médico inexistente com 404', async () => {
      lockDoctor.mockResolvedValue(false)

      await expect(createAt('2026-10-13T08:00:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.RECURSO_NAO_ENCONTRADO,
        },
      )
    })

    it.each([
      ['fora de qualquer turno', '2026-10-13T13:00:00-03:00'],
      ['em dia da semana sem turno', '2026-10-14T08:00:00-03:00'],
      ['desalinhado da grade', '2026-10-13T08:20:00-03:00'],
      ['com segundos', '2026-10-13T08:00:30-03:00'],
    ])('recusa horário %s com 422', async (_scenario, startsAt) => {
      await expect(createAt(startsAt)).rejects.toMatchObject({
        code: ERROR_CODE.HORARIO_FORA_DA_ESCALA,
      })
      expect(createAppointment).not.toHaveBeenCalled()
    })

    it('recusa consulta que não cabe no fim do turno com 422', async () => {
      findWorkSchedule.mockResolvedValue(buildWorkSchedule('11:50'))

      await expect(createAt('2026-10-13T11:30:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.HORARIO_FORA_DA_ESCALA,
        },
      )
    })

    it('recusa médico sem escala com 422', async () => {
      findWorkSchedule.mockResolvedValue(null)

      await expect(createAt('2026-10-13T08:00:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.HORARIO_FORA_DA_ESCALA,
        },
      )
    })

    it('recusa conflito com consulta do médico com 409 HORARIO_INDISPONIVEL', async () => {
      doctorAppointments = [
        buildAppointment('2026-10-13T11:20:00Z', '2026-10-13T11:50:00Z'),
      ]

      await expect(createAt('2026-10-13T08:00:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.HORARIO_INDISPONIVEL,
        },
      )
      expect(createAppointment).not.toHaveBeenCalled()
    })

    it('recusa conflito com consulta do paciente com 409 PACIENTE_INDISPONIVEL', async () => {
      patientAppointments = [
        buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:20:00Z'),
      ]

      await expect(createAt('2026-10-13T08:00:00-03:00')).rejects.toMatchObject(
        {
          code: ERROR_CODE.PACIENTE_INDISPONIVEL,
        },
      )
      expect(createAppointment).not.toHaveBeenCalled()
    })
  })

  describe('updateStatus', () => {
    const scheduled = () =>
      buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:30:00Z')

    it('o médico da consulta inicia o atendimento', async () => {
      findById.mockResolvedValue(scheduled())

      const result = await appointmentService.updateStatus(
        41,
        { status: APPOINTMENT_STATUS.IN_PROGRESS },
        buildUser([RoleName.DOCTOR]),
      )

      expect(result.status).toBe(APPOINTMENT_STATUS.IN_PROGRESS)
      expect(updateStatus).toHaveBeenCalledWith(
        41,
        APPOINTMENT_STATUS.SCHEDULED,
        APPOINTMENT_STATUS.IN_PROGRESS,
      )
    })

    it('a secretária cancela consulta agendada', async () => {
      findById.mockResolvedValue(scheduled())

      await expect(
        appointmentService.updateStatus(
          41,
          { status: APPOINTMENT_STATUS.CANCELLED },
          buildUser([RoleName.SECRETARY]),
        ),
      ).resolves.toMatchObject({ status: APPOINTMENT_STATUS.CANCELLED })
    })

    it('recusa transição fora do ciclo com 422', async () => {
      findById.mockResolvedValue(
        buildAppointment(
          '2026-10-13T11:00:00Z',
          '2026-10-13T11:30:00Z',
          APPOINTMENT_STATUS.DONE,
        ),
      )

      await expect(
        appointmentService.updateStatus(
          41,
          { status: APPOINTMENT_STATUS.CANCELLED },
          buildUser([RoleName.ADMIN]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.TRANSICAO_INVALIDA })
      expect(updateStatus).not.toHaveBeenCalled()
    })

    it('recusa secretária cancelando consulta em andamento com 403', async () => {
      findById.mockResolvedValue(
        buildAppointment(
          '2026-10-13T11:00:00Z',
          '2026-10-13T11:30:00Z',
          APPOINTMENT_STATUS.IN_PROGRESS,
        ),
      )

      await expect(
        appointmentService.updateStatus(
          41,
          { status: APPOINTMENT_STATUS.CANCELLED },
          buildUser([RoleName.SECRETARY]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })

    it('recusa médico que não é o da consulta com 403', async () => {
      findById.mockResolvedValue(scheduled())
      findDoctorByUserId.mockResolvedValue({ id: OTHER_DOCTOR_ID } as Doctor)

      await expect(
        appointmentService.updateStatus(
          41,
          { status: APPOINTMENT_STATUS.IN_PROGRESS },
          buildUser([RoleName.DOCTOR]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })

    it('recusa agendamento inexistente com 404', async () => {
      findById.mockResolvedValue(null)

      await expect(
        appointmentService.updateStatus(
          99,
          { status: APPOINTMENT_STATUS.CANCELLED },
          buildUser([RoleName.ADMIN]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.RECURSO_NAO_ENCONTRADO })
    })

    it('recusa com 422 quando outra pessoa mudou o status antes', async () => {
      findById.mockResolvedValue(scheduled())
      updateStatus.mockResolvedValue(false)

      await expect(
        appointmentService.updateStatus(
          41,
          { status: APPOINTMENT_STATUS.CANCELLED },
          buildUser([RoleName.ADMIN]),
        ),
      ).rejects.toMatchObject({ code: ERROR_CODE.TRANSICAO_INVALIDA })
    })
  })

  describe('findById', () => {
    it('devolve o agendamento para admin', async () => {
      findById.mockResolvedValue(
        buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:30:00Z'),
      )

      await expect(
        appointmentService.findById(41, buildUser([RoleName.ADMIN])),
      ).resolves.toMatchObject({ id: 41 })
    })

    it('recusa médico que não é o da consulta com 403', async () => {
      findById.mockResolvedValue(
        buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:30:00Z'),
      )
      findDoctorByUserId.mockResolvedValue({ id: OTHER_DOCTOR_ID } as Doctor)

      await expect(
        appointmentService.findById(41, buildUser([RoleName.DOCTOR])),
      ).rejects.toMatchObject({ code: ERROR_CODE.ACESSO_NEGADO })
    })

    it('recusa agendamento inexistente com 404', async () => {
      findById.mockResolvedValue(null)

      await expect(
        appointmentService.findById(99, buildUser([RoleName.ADMIN])),
      ).rejects.toMatchObject({ code: ERROR_CODE.RECURSO_NAO_ENCONTRADO })
    })
  })

  describe('findAll', () => {
    const query = { page: 1, pageSize: 20, doctorId: OTHER_DOCTOR_ID }

    it('força o filtro do próprio médico para o perfil doctor', async () => {
      await appointmentService.findAll(query, buildUser([RoleName.DOCTOR]))

      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({ doctorId: DOCTOR_ID }),
      )
    })

    it('devolve lista vazia para doctor sem cadastro de médico', async () => {
      findDoctorByUserId.mockResolvedValue(null)

      const result = await appointmentService.findAll(
        query,
        buildUser([RoleName.DOCTOR]),
      )

      expect(result.data).toEqual([])
      expect(findAll).not.toHaveBeenCalled()
    })

    it('aplica os filtros da query para admin, com o dia inteiro em to', async () => {
      findAll.mockResolvedValue([
        [buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:30:00Z')],
        1,
      ])

      const result = await appointmentService.findAll(
        { ...query, from: '2026-10-12', to: '2026-10-12' },
        buildUser([RoleName.ADMIN]),
      )

      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorId: OTHER_DOCTOR_ID,
          from: new Date('2026-10-12T03:00:00.000Z'),
          to: new Date('2026-10-13T03:00:00.000Z'),
        }),
      )
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      })
    })
  })

  describe('getDoctorCalendar', () => {
    it('devolve a escala e as consultas ativas do período', async () => {
      findActiveByDoctorInPeriod.mockResolvedValue([
        buildAppointment('2026-10-13T11:00:00Z', '2026-10-13T11:30:00Z'),
      ])

      const result = await appointmentService.getDoctorCalendar(DOCTOR_ID, {
        from: '2026-10-12',
        to: '2026-10-16',
      })

      expect(result.workSchedule.shifts).toEqual([
        {
          weekDay: 2,
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 30,
        },
      ])
      expect(result.appointments).toHaveLength(1)
    })

    it('devolve shifts vazio para médico sem escala', async () => {
      findByDoctorId.mockResolvedValue(null)

      const result = await appointmentService.getDoctorCalendar(DOCTOR_ID, {
        from: '2026-10-12',
        to: '2026-10-12',
      })

      expect(result.workSchedule).toEqual({ shifts: [] })
    })

    it.each([
      ['from posterior a to', '2026-10-16', '2026-10-12'],
      ['intervalo maior que 31 dias', '2026-10-01', '2026-11-01'],
    ])('recusa %s com 400', async (_scenario, from, to) => {
      await expect(
        appointmentService.getDoctorCalendar(DOCTOR_ID, { from, to }),
      ).rejects.toMatchObject({ code: ERROR_CODE.DADOS_INVALIDOS })
    })

    it('recusa médico inexistente com 404', async () => {
      findDoctorById.mockResolvedValue(null)

      await expect(
        appointmentService.getDoctorCalendar(DOCTOR_ID, {
          from: '2026-10-12',
          to: '2026-10-16',
        }),
      ).rejects.toMatchObject({ code: ERROR_CODE.RECURSO_NAO_ENCONTRADO })
    })
  })
})
