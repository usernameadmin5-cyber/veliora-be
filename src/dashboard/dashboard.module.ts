import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SurveyModule } from '../survey/survey.module';
import { PremiumModule } from '../premium/premium.module';
import { AppLogger } from '../common/logger/app-logger.service';
import { ResetTip, ResetTipSchema } from './schemas/reset-tip.schema';

@Module({
  imports: [
    SurveyModule,
    PremiumModule,
    MongooseModule.forFeature([
      { name: ResetTip.name, schema: ResetTipSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, AppLogger],
})
export class DashboardModule {}
