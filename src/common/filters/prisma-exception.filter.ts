import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    const errorLog = `[Prisma Error] ${request.method} ${request.url} - Code: ${exception.code} - ${exception.message}`;

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        httpStatus = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        this.logger.warn(errorLog);
        response.status(httpStatus).json({
          success: false,
          statusCode: httpStatus,
          message: message,
          error: 'This record already exists',
        });
        break;
      case 'P2025':
        // Record not found
        httpStatus = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        this.logger.warn(errorLog);
        response.status(httpStatus).json({
          success: false,
          statusCode: httpStatus,
          message: message,
        });
        break;
      default:
        // Default 500 error
        this.logger.error(errorLog, exception.stack);
        response.status(httpStatus).json({
          success: false,
          statusCode: httpStatus,
          message: message,
        });
    }
  }
}
