import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : exceptionResponse;

    const errorMessage = `[${request.method}] ${request.url} - ${status} - ${JSON.stringify(error)}`;

    if (status >= 500) {
      this.logger.error(errorMessage, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(errorMessage);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...error,
    });
  }
}
