import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, type Content } from '@google/genai';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class GeminiService implements OnModuleInit {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(
    private readonly logger: AppLogger,
    private readonly config: ConfigService,
  ) {
    this.logger.setContext('GeminiService');
  }

  onModuleInit() {
    const project = this.config.get<string>('GOOGLE_CLOUD_PROJECT');
    const location =
      this.config.get<string>('GOOGLE_CLOUD_LOCATION') ?? 'us-central1';
    this.modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    if (!project) {
      this.logger.warn(
        'GOOGLE_CLOUD_PROJECT is not set — AI chat will return error responses. ' +
          'Set GOOGLE_CLOUD_PROJECT and ensure Application Default Credentials are available ' +
          '(GOOGLE_APPLICATION_CREDENTIALS pointing to a service-account key JSON, or `gcloud auth application-default login`).',
      );
    }

    this.ai = new GoogleGenAI({
      vertexai: true,
      project: project ?? '',
      location,
    });
  }

  async chat(
    systemPrompt: string,
    history: Content[],
    userMessage: string,
  ): Promise<string> {
    const chat = this.ai.chats.create({
      model: this.modelName,
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: "Understood. I'll follow these guidelines." }],
        },
        ...history,
      ],
    });
    const result = await chat.sendMessage({ message: userMessage });
    return result.text ?? '';
  }
}
