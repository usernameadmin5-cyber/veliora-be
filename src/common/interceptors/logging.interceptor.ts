import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        this.logger.log(`${method} ${url} ${res.statusCode}`, {
          duration: `${Date.now() - start}ms`,
        });
      }),
      catchError((err) => {
        const status = err?.status ?? 500;
        this.logger.error(`${method} ${url} ${status}`, err, {
          duration: `${Date.now() - start}ms`,
          errorName: err?.name,
        });
        return throwError(() => err);
      }),
    );
  }
}
