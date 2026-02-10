import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails = {};

    if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        stack: exception.stack,
      };

      // Log the full error with stack trace
      this.logger.error(
        `An error occurred: ${exception.message}`,
        exception.stack,
        exception.constructor.name,
      );
    } else if (typeof exception === 'object' && exception !== null) {
      const exceptionObj = exception as Record<string, unknown>;
      if ('statusCode' in exceptionObj) {
        status = exceptionObj.statusCode as number;
      }
      if ('message' in exceptionObj) {
        message = exceptionObj.message as string;
      }
      errorDetails = exceptionObj;

      this.logger.error(
        `An error occurred: ${JSON.stringify(exceptionObj)}`,
        (exception as any)?.stack,
      );
    } else {
      this.logger.error(`An unknown error occurred: ${String(exception)}`);
    }

    const responseBody = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { errorDetails }),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
