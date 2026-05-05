import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './common/audit/audit.module';
import { EmailModule } from './common/email/email.module';
import { StorageModule } from './common/storage/storage.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SurveyModule } from './survey/survey.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PremiumModule } from './premium/premium.module';
import { PracticesModule } from './practices/practices.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuditModule,
    EmailModule,
    StorageModule,
    HealthModule,
    UsersModule,
    AuthModule,
    SurveyModule,
    DashboardModule,
    PremiumModule,
    PracticesModule,
    AiModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
