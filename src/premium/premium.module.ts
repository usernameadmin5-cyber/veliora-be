import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';
import { RenewalTask } from './tasks/renewal.task';
import { AuditModule } from '../common/audit/audit.module';
import { AppLogger } from '../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    AuditModule,
  ],
  controllers: [PremiumController],
  providers: [PremiumService, RenewalTask, AppLogger],
  exports: [PremiumService],
})
export class PremiumModule {}
