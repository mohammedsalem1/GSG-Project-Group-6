import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        response.status(HttpStatus.CONFLICT).json({
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: 'Unique constraint violation',
          error: 'This record already exists',
        });
        break;
      case 'P2025':
        // Record not found
        response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        });
        break;
      default:
        // Default 500 error
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
    }
  }
}
