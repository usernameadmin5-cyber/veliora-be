import { Controller, Get, Query, Request } from '@nestjs/common';
import type { Request as Req } from 'express';
import { PracticesService } from './practices.service';
import { QueryPracticesDto } from './dto/query-practices.dto';

interface JwtUser {
  userId: string;
}

@Controller('practices')
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Get()
  getPractices(@Query() query: QueryPracticesDto) {
    return this.practicesService.getPractices(query);
  }

  @Get('recommended')
  getRecommended(@Request() req: Req & { user: JwtUser }) {
    return this.practicesService.getRecommended(req.user.userId);
  }
}
