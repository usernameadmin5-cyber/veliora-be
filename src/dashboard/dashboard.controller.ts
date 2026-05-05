import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('check-in/today')
  @ApiOperation({ summary: "Get today's check-in" })
  getTodayCheckIn(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getTodayCheckIn(user.sub);
  }

  @Get('weekly-progress')
  @ApiQuery({ name: 'timezone', required: false })
  @ApiQuery({ name: 'weekStart', required: false, description: 'YYYY-MM-DD; any date inside the desired Mon-Sun week' })
  @ApiOperation({ summary: 'Get weekly stress/activity progress' })
  getWeeklyProgress(
    @CurrentUser() user: JwtPayload,
    @Query('timezone') timezone?: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.dashboardService.getWeeklyProgress(user.sub, timezone, weekStart);
  }

  @Post('practice/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a practice session' })
  startPractice(
    @Body() dto: StartPracticeDto,
    @CurrentUser() user: JwtPayload,
    @Req() _req: Request,
  ) {
    return this.dashboardService.startPractice(dto, user.sub);
  }

  @Get('small-reset/tip')
  @ApiQuery({ name: 'lang', required: false })
  @ApiOperation({ summary: 'Get a random small reset tip' })
  getRandomResetTip(@Query('lang') lang?: string) {
    return this.dashboardService.getRandomResetTip(lang ?? 'en');
  }

  @Post('small-reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a small reset session' })
  startSmallReset() {
    return this.dashboardService.startSmallReset();
  }
}
