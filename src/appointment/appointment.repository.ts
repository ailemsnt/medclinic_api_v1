import { Injectable } from '@nestjs/common'
import { Appointment } from './../@common/entities/appointment'
import {
  Repository,
  FindOptionsWhere,
  Not,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  And,
  In,
  EntityManager,
} from 'typeorm'

import { APPOINTMENT_STATUS } from '../@common/entities/appointment'
import { Patient } from '../patient/patient.entity'
import { WorkSchedule } from '../doctor/work-schedule.entity'
import { Doctor } from '../doctor/doctor.entity'

export interface AppointmentCreateInput {
  doctorId: number
  patientId: number
  startsAt: Date
  endsAt: Date
}

export interface AppointmentFindFilter {
  page: number
  pageSize: number
  doctorId?: number
  patientId?: number
  status?: APPOINTMENT_STATUS
  from?: Date
  to?: Date
}

export type AppointmentParticipant =
  { doctorId: number } | { patientId: number }

/** Operações que o service usa dentro da transação do agendamento. */
export interface AppointmentTransaction {
  lockDoctor(doctorId: number): Promise<boolean>
  findWorkSchedule(doctorId: number): Promise<WorkSchedule | null>
  findActiveInPeriod(
    participant: AppointmentParticipant,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>
  createAppointment(input: AppointmentCreateInput): Promise<Appointment>
}

function activeInPeriodWhere(
  participant: AppointmentParticipant,
  from: Date,
  to: Date,
): FindOptionsWhere<Appointment> {
  return {
    ...participant,
    status: Not(APPOINTMENT_STATUS.CANCELLED),
    startsAt: LessThan(to),
    endsAt: MoreThan(from),
  }
}

@Injectable()
export class AppointmentRepository extends Repository<Appointment> {
  async patientExists(patientId: number): Promise<boolean> {
    return this.manager.getRepository(Patient).existsBy({ id: patientId })
  }

  /** Tudo o que roda em `work` usa o EntityManager da transação. */
  async runInTransaction<T>(
    work: (transaction: AppointmentTransaction) => Promise<T>,
  ): Promise<T> {
    return this.manager.transaction((transactionManager) =>
      work(this.buildTransaction(transactionManager)),
    )
  }

  async updateStatus(
    id: number,
    currentStatus: APPOINTMENT_STATUS,
    newStatus: APPOINTMENT_STATUS,
  ): Promise<boolean> {
    const updateResult = await this.update(
      { id, status: currentStatus },
      { status: newStatus },
    )
    return (updateResult.affected ?? 0) > 0
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.findOne({ where: { id } })
  }

  async findAll(
    filter: AppointmentFindFilter,
  ): Promise<[Appointment[], number]> {
    const where: FindOptionsWhere<Appointment> = {}

    if (filter.doctorId) where.doctorId = filter.doctorId
    if (filter.patientId) where.patientId = filter.patientId
    if (filter.status) where.status = filter.status

    if (filter.from && filter.to) {
      where.startsAt = And(MoreThanOrEqual(filter.from), LessThan(filter.to))
    } else if (filter.from) {
      where.startsAt = MoreThanOrEqual(filter.from)
    } else if (filter.to) {
      where.startsAt = LessThan(filter.to)
    }

    return this.findAndCount({
      where,
      order: { startsAt: 'ASC' },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    })
  }

  async findActiveByDoctorInPeriod(
    doctorId: number,
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    return this.find({
      where: activeInPeriodWhere({ doctorId }, from, to),
      order: { startsAt: 'ASC' },
    })
  }

  /** Vínculo clínico (RN14): consulta em andamento ou concluída entre os dois. */
  async hasClinicalLink(doctorId: number, patientId: number): Promise<boolean> {
    return this.exists({
      where: {
        doctorId,
        patientId,
        status: In([APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.DONE]),
      },
    })
  }

  private buildTransaction(
    transactionManager: EntityManager,
  ): AppointmentTransaction {
    return {
      lockDoctor: async (doctorId) => {
        const doctor = await transactionManager
          .getRepository(Doctor)
          .createQueryBuilder('doctor')
          .innerJoin('doctor.user', 'user')
          .where('doctor.id = :doctorId', { doctorId })
          .andWhere('user.deletedAt IS NULL')
          .setLock('pessimistic_write', undefined, ['doctor'])
          .getOne()
        return doctor !== null
      },

      findWorkSchedule: (doctorId) =>
        transactionManager.findOne(WorkSchedule, { where: { doctorId } }),

      findActiveInPeriod: (participant, from, to) =>
        transactionManager.find(Appointment, {
          where: activeInPeriodWhere(participant, from, to),
        }),

      createAppointment: (input) =>
        transactionManager.save(
          transactionManager.create(Appointment, {
            ...input,
            status: APPOINTMENT_STATUS.SCHEDULED,
          }),
        ),
    }
  }
}
