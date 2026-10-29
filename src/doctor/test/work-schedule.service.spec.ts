import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { ERROR_CODE } from '../../@common/errors/domain.error'
import { Doctor } from '../doctor.entity'
import { DoctorRepository } from '../doctor.repository'
import { ShiftDto } from '../dto/work-schedule-create.dto'
import { WorkSchedule } from '../work-schedule.entity'
import { WorkScheduleRepository } from '../work-schedule.repository'
import { WorkScheduleService } from '../work-schedule.service'

const DOCTOR_ID = 3

function shift(
  weekDay: number,
  startTime: string,
  endTime: string,
  slotDurationMinutes = 30,
): ShiftDto {
  return { weekDay, startTime, endTime, slotDurationMinutes }
}

describe(WorkScheduleService.name, () => {
  let workScheduleService: WorkScheduleService
  let findByDoctorId: Mock<WorkScheduleRepository['findByDoctorId']>
  let replaceConfiguration: Mock<WorkScheduleRepository['replaceConfiguration']>
  let findDoctorById: Mock<DoctorRepository['findById']>

  beforeEach(() => {
    findByDoctorId = vi
      .fn<WorkScheduleRepository['findByDoctorId']>()
      .mockResolvedValue(null)
    replaceConfiguration = vi
      .fn<WorkScheduleRepository['replaceConfiguration']>()
      .mockResolvedValue()
    findDoctorById = vi
      .fn<DoctorRepository['findById']>()
      .mockResolvedValue({ id: DOCTOR_ID } as Doctor)

    workScheduleService = new WorkScheduleService(
      {
        findByDoctorId,
        replaceConfiguration,
      } as unknown as WorkScheduleRepository,
      { findById: findDoctorById } as unknown as DoctorRepository,
    )
  })

  describe('replace', () => {
    it('aceita turnos encostados e devolve o mesmo formato enviado', async () => {
      const shifts = [
        shift(2, '12:00', '18:00', 20),
        shift(2, '08:00', '12:00'),
      ]

      const result = await workScheduleService.replace(DOCTOR_ID, { shifts })

      expect(result.shifts).toEqual([
        shift(2, '08:00', '12:00'),
        shift(2, '12:00', '18:00', 20),
      ])
      expect(replaceConfiguration).toHaveBeenCalledWith(DOCTOR_ID, [
        {
          weekDay: 2,
          duration: 20,
          time: [{ startTime: '12:00', endTime: '18:00' }],
        },
        {
          weekDay: 2,
          duration: 30,
          time: [{ startTime: '08:00', endTime: '12:00' }],
        },
      ])
    })

    it('agrupa turnos do mesmo dia e mesma duração', async () => {
      await workScheduleService.replace(DOCTOR_ID, {
        shifts: [shift(4, '08:00', '11:00'), shift(4, '14:00', '17:00')],
      })

      expect(replaceConfiguration).toHaveBeenCalledWith(DOCTOR_ID, [
        {
          weekDay: 4,
          duration: 30,
          time: [
            { startTime: '08:00', endTime: '11:00' },
            { startTime: '14:00', endTime: '17:00' },
          ],
        },
      ])
    })

    it('aceita o mesmo horário em dias diferentes', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(2, '08:00', '12:00'), shift(3, '08:00', '12:00')],
        }),
      ).resolves.toBeDefined()
    })

    it('aceita lista vazia, que apaga a escala', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, { shifts: [] }),
      ).resolves.toEqual({ shifts: [] })
      expect(replaceConfiguration).toHaveBeenCalledWith(DOCTOR_ID, [])
    })

    it('recusa turnos sobrepostos no mesmo dia com 400', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(2, '08:00', '12:00'), shift(2, '11:00', '14:00')],
        }),
      ).rejects.toMatchObject({ code: ERROR_CODE.DADOS_INVALIDOS })
      expect(replaceConfiguration).not.toHaveBeenCalled()
    })

    it('recusa startTime maior ou igual a endTime com 400', async () => {
      await expect(
        workScheduleService.replace(DOCTOR_ID, {
          shifts: [shift(2, '12:00', '12:00')],
        }),
      ).rejects.toMatchObject({ code: ERROR_CODE.DADOS_INVALIDOS })
    })

    it('recusa médico inexistente com 404', async () => {
      findDoctorById.mockResolvedValue(null)

      await expect(
        workScheduleService.replace(DOCTOR_ID, { shifts: [] }),
      ).rejects.toMatchObject({ code: ERROR_CODE.RECURSO_NAO_ENCONTRADO })
    })
  })

  describe('findByDoctor', () => {
    it('devolve shifts vazio para médico sem escala', async () => {
      await expect(
        workScheduleService.findByDoctor(DOCTOR_ID),
      ).resolves.toEqual({ shifts: [] })
    })

    it('devolve a escala cadastrada', async () => {
      findByDoctorId.mockResolvedValue({
        configuration: [
          {
            weekDay: 2,
            duration: 30,
            time: [{ startTime: '08:00', endTime: '12:00' }],
          },
        ],
      } as WorkSchedule)

      await expect(
        workScheduleService.findByDoctor(DOCTOR_ID),
      ).resolves.toEqual({ shifts: [shift(2, '08:00', '12:00')] })
    })
  })
})
