import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Practice, PracticeSchema } from '../practices/schemas/practice.schema';
import {
  ResetTip,
  ResetTipSchema,
} from '../dashboard/schemas/reset-tip.schema';
import {
  SurveySubmission,
  SurveySubmissionSchema,
} from '../survey/schemas/survey-submission.schema';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Practice.name, schema: PracticeSchema },
      { name: ResetTip.name, schema: ResetTipSchema },
      { name: SurveySubmission.name, schema: SurveySubmissionSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
