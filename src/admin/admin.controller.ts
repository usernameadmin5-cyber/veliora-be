import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpsertPracticeDto } from './dto/upsert-practice.dto';
import { UpsertResetDto } from './dto/upsert-reset.dto';
import { UpsertSurveyDto } from './dto/upsert-survey.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Auth ───────────────────────────────────────────────────────────────────

  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard)
  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(Number(page ?? 1), Number(limit ?? 50));
  }

  @UseGuards(AdminGuard)
  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }

  @UseGuards(AdminGuard)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ── Practices ─────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard)
  @Get('practices')
  getPractices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getPractices(
      Number(page ?? 1),
      Number(limit ?? 50),
    );
  }

  @UseGuards(AdminGuard)
  @Post('practices')
  createPractice(@Body() dto: UpsertPracticeDto) {
    return this.adminService.createPractice(dto);
  }

  @UseGuards(AdminGuard)
  @Patch('practices/:id')
  updatePractice(@Param('id') id: string, @Body() dto: UpsertPracticeDto) {
    return this.adminService.updatePractice(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('practices/:id')
  deletePractice(@Param('id') id: string) {
    return this.adminService.deletePractice(id);
  }

  // ── Reset tips ────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard)
  @Get('resets')
  getResetTips() {
    return this.adminService.getResetTips();
  }

  @UseGuards(AdminGuard)
  @Post('resets')
  createResetTip(@Body() dto: UpsertResetDto) {
    return this.adminService.createResetTip(dto);
  }

  @UseGuards(AdminGuard)
  @Patch('resets/:id')
  updateResetTip(@Param('id') id: string, @Body() dto: UpsertResetDto) {
    return this.adminService.updateResetTip(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('resets/:id')
  deleteResetTip(@Param('id') id: string) {
    return this.adminService.deleteResetTip(id);
  }

  // ── Surveys ────────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard)
  @Get('users/:userId/surveys')
  getUserSurveys(@Param('userId') userId: string) {
    return this.adminService.getUserSurveys(userId);
  }

  @UseGuards(AdminGuard)
  @Post('users/:userId/surveys')
  createSurvey(@Param('userId') userId: string, @Body() dto: UpsertSurveyDto) {
    return this.adminService.createSurvey(userId, dto);
  }

  @UseGuards(AdminGuard)
  @Patch('surveys/:id')
  updateSurvey(@Param('id') id: string, @Body() dto: UpsertSurveyDto) {
    return this.adminService.updateSurvey(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('surveys/:id')
  deleteSurvey(@Param('id') id: string) {
    return this.adminService.deleteSurvey(id);
  }
}
