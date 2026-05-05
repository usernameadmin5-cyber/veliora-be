import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SurveySubmission,
  SurveySubmissionSchema,
} from './schemas/survey-submission.schema';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { AuditModule } from '../common/audit/audit.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
    ]),
    AuditModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
