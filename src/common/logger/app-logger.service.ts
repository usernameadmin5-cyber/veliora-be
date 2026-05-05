import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLogger {
  private readonly logger = new Logger('App');

  setContext(context: string) {
    (this.logger as any).context = context;
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.log(this.format(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(this.format(message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(this.format(message, meta), stack);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(this.format(message, meta));
  }

  private format(message: string, meta?: Record<string, unknown>): string {
    if (!meta) return message;
    return `${message} ${JSON.stringify(meta)}`;
  }
}
