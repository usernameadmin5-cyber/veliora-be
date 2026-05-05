import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { OtpCode, OtpCodeSchema } from './schemas/otp-code.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PremiumModule } from '../premium/premium.module';
import { SurveyModule } from '../survey/survey.module';
import { EmailModule } from '../common/email/email.module';
import { AuditModule } from '../common/audit/audit.module';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OtpCode.name, schema: OtpCodeSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    EmailModule,
    AuditModule,
    StorageModule,
    PremiumModule,
    forwardRef(() => SurveyModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
