import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AppLogger } from '../logger/app-logger.service';

@Module({
  providers: [EmailService, AppLogger],
  exports: [EmailService],
})
export class EmailModule {}
