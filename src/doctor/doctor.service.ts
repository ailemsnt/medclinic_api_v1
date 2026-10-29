import { Injectable } from '@nestjs/common'
import { DomainError, ERROR_CODE } from '../@common/errors/domain.error'
import { DoctorCreateDto } from './dto/doctor-create.dto'
import { DoctorResponseDto } from './dto/doctor-response.dto'
import { UserService } from '../user/user.service'
import { DoctorRepository } from './doctor.repository'
import { hashPassword } from '../@common/utils/hash-password'
import { DoctorListDto } from './dto/doctor-list.dto'
import { PaginatedResponseDto } from '../@common/dto/paginated-response.dto'
@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userService: UserService,
  ) {}

  async create(dto: DoctorCreateDto): Promise<DoctorResponseDto> {
    const existsUser = await this.userService.getUserByEmail(dto.email)
    if (existsUser) {
      throw new DomainError(
        'E-mail já cadastrado',
        ERROR_CODE.EMAIL_JA_CADASTRADO,
      )
    }

    const existsDoctor = await this.doctorRepository.findByCrm(dto.crm)
    if (existsDoctor) {
      throw new DomainError('CRM já cadastrado', ERROR_CODE.CRM_JA_CADASTRADO)
    }

    const doctor = await this.doctorRepository.createDoctorWithUser({
      name: dto.name,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      crm: dto.crm,
    })

    return DoctorResponseDto.resultEntity(doctor)
  }

  async findById(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findById(id)
    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
    return DoctorResponseDto.resultEntity(doctor)
  }

  async findByCrm(crm: string): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findByCrm(crm)
    if (!doctor) {
      throw new DomainError(
        'Médico não encontrado',
        ERROR_CODE.RECURSO_NAO_ENCONTRADO,
      )
    }
    return DoctorResponseDto.resultEntity(doctor)
  }

  async findAll(
    query: DoctorListDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const [doctors, total] = await this.doctorRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      name: query.name,
    })

    return PaginatedResponseDto.create(
      doctors.map((doctor) => DoctorResponseDto.resultEntity(doctor)),
      total,
      query.page,
      query.pageSize,
    )
  }
}
