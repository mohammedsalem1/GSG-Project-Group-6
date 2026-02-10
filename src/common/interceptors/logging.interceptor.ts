import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const now = Date.now();
    const userAgent = request.get('user-agent');
    const ip = request.ip;

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`[${method}] ${url} - ${responseTime}ms from ${ip}`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        this.logger.error(
          `[${method}] ${url} - ${responseTime}ms - Error: ${error.message}`,
          {
            error: error.message,
            stack: error.stack,
            method,
            url,
            ip,
            userAgent,
            responseTime,
          },
          'HttpException',
        );
        return throwError(() => error);
      }),
    );
  }
}
