import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import type { Request as Req } from 'express';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat-message.dto';

interface JwtUser {
  userId: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  sendMessage(
    @Body() dto: ChatMessageDto,
    @Request() req: Req & { user: JwtUser },
  ) {
    return this.aiService.sendMessage(dto, req.user.userId);
  }

  @Get('chat/history')
  getHistory(
    @Query('limit') limit: string,
    @Request() req: Req & { user: JwtUser },
  ) {
    return this.aiService.getHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('chat/limits')
  getLimits(@Request() req: Req & { user: JwtUser }) {
    return this.aiService.getLimits(req.user.userId);
  }
}
