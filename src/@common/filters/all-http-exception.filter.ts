import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
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

    super.catch(exception, host)
  }
}