import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const r = exceptionResponse as Record<string, unknown>;
      message = Array.isArray(r['message'])
        ? (r['message'] as string[]).join('; ')
        : String(r['message'] ?? exception.message);
    } else {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
    });
  }
}
