import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

import { DomainError, ERROR_CODE } from '../errors/domain.error'

@Catch()
export class AllHttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof DomainError) {
      const httpException = new HttpException(
        {
          statusCode: exception.status,
          error: exception.code,
          message: exception.message,
        },
        exception.status,
      )
      super.catch(httpException, host)
      return
    }

    if (exception instanceof BadRequestException) {
      
      super.catch(
        new HttpException(
          {
            statusCode: 400,
            error: ERROR_CODE.DADOS_INVALIDOS,
            message: exception.message,
          },
          400,
        ),
        host,
      )
      return
    }

    if (exception instanceof UnauthorizedException) {
      
      super.catch(
        new HttpException(
          {
            statusCode: 401,
            error: ERROR_CODE.NAO_AUTENTICADO,
            message: exception.message,
          },
          401,
        ),
        host,
      )
      return
    }

    if (exception instanceof ForbiddenException) {
      
      super.catch(
        new HttpException(
          {
            statusCode: 403,
            error: ERROR_CODE.ACESSO_NEGADO,
            message: exception.message,
          },
          403,
        ),
        host,
      )
      return
    }

    super.catch(exception, host)
  }
}