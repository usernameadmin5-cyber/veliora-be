import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../common/audit/audit.module';
import { EmailModule } from '../common/email/email.module';
import { AppLogger } from '../common/logger/app-logger.service';
import { OtpCode, OtpCodeSchema } from '../users/schemas/otp-code.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../users/schemas/refresh-token.schema';

@Module({
  imports: [
    UsersModule,
    AuditModule,
    EmailModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: OtpCode.name, schema: OtpCodeSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, AppLogger],
})
export class AuthModule {}
