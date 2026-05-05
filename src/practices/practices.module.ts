import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Practice, PracticeSchema } from './schemas/practice.schema';
import { PracticesService } from './practices.service';
import { PracticesController } from './practices.controller';
import { UsersModule } from '../users/users.module';
import { SurveyModule } from '../survey/survey.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Practice.name, schema: PracticeSchema },
    ]),
    UsersModule,
    SurveyModule,
  ],
  controllers: [PracticesController],
  providers: [PracticesService],
  exports: [PracticesService, MongooseModule],
})
export class PracticesModule {}
