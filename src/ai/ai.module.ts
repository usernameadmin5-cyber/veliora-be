import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiChatMessage,
  AiChatMessageSchema,
} from './schemas/ai-chat-message.schema';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { AttachmentService } from './attachment.service';
import { PromptSafetyService } from './prompt-safety.service';
import { PremiumModule } from '../premium/premium.module';
import { PracticesModule } from '../practices/practices.module';
import { UsersModule } from '../users/users.module';
import { SurveyModule } from '../survey/survey.module';
import { AppLogger } from '../common/logger/app-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiChatMessage.name, schema: AiChatMessageSchema },
    ]),
    PremiumModule,
    PracticesModule,
    UsersModule,
    SurveyModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    AttachmentService,
    PromptSafetyService,
    AppLogger,
  ],
})
export class AiModule {}
