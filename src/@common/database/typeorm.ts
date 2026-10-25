import { env } from '../config/env.config'
import { DataSource, LoggerOptions } from 'typeorm'

import { SnakeCaseNamingStrategy } from './snake-case-naming-pattern'
import { User } from '../entities/user.entity'
import { Doctor } from '../entities/doctor'
import { FactoryProvider, Type } from '@nestjs/common'
import { Role } from '../entities/role.entity'
import { Appointment } from '../entities/appointment'
import { MedicalRecord } from '../entities/medical-record'
import { Patient } from '../entities/patient'
import { WorkSchedule } from '../entities/work-schedule'

export const ENTITIES = [
  Role,
  User,
  Doctor,
  Patient,
  Appointment,
  MedicalRecord,
  WorkSchedule,
]

export const appDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  poolSize: 10,
  /**
   * Só da pra utilizar em ambiente de desenvolvimento
   */
  synchronize: env.DB_SYNCHRONIZE,
  /**
   * export type LogLevel = "query" | "schema" | "error" | "warn" | "info" | "log" | "migration";
   */
  logging: (env.DB_LOG_LEVEL ?? 'error') as LoggerOptions,
  entities: ENTITIES,
  namingStrategy: new SnakeCaseNamingStrategy(),
  migrations: [__dirname + '/migrations/**/*{.js,.ts}'],
  invalidWhereValuesBehavior: { undefined: 'ignore', null: 'sql-null' },
})

// export async function initDatabase() {
//   await AppDataSource.initialize();

//   await AppDataSource.runMigrations({
//     transaction: 'each',
//   });
// }

export const databaseProvider: FactoryProvider<DataSource> = {
  provide: DataSource,
  async useFactory() {
    const AppDataSource = appDataSource

    await AppDataSource.initialize()

    await AppDataSource.runMigrations({
      transaction: 'each',
    })

    return AppDataSource
  },
}

export function typeOrmRepositoryFactory<T, U>(
  repositoryCls: Type<T>,
  entityClass: Type<U>,
): FactoryProvider<T> {
  return {
    provide: repositoryCls,
    useFactory(dataSource: DataSource) {
      const repo = new repositoryCls(entityClass, dataSource.manager)
      return repo
    },
    inject: [DataSource],
  }
}
