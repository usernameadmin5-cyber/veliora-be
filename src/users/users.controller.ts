import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as Req } from 'express';
import type { File as MulterFile } from 'multer';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { PremiumService } from '../premium/premium.service';
import { SurveyService } from '../survey/survey.service';

interface JwtUser {
  userId: string;
}

const MAX_AVATAR_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_AVATAR_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly premiumService: PremiumService,
    private readonly surveyService: SurveyService,
  ) {}

  private async buildProfile(userId: string) {
    const [user, isPremium, { moodThisWeek, stressAvg }] = await Promise.all([
      this.usersService.findById(userId),
      this.premiumService.isPremium(userId),
      this.surveyService.getWeeklyStats(userId),
    ]);

    return {
      id: user?._id?.toString(),
      name: user?.name ?? '',
      email: user?.email ?? '',
      age: user?.age ?? null,
      timeZone: user?.timeZone ?? 'UTC',
      language: (user?.language ?? 'en') as 'en' | 'uk',
      hasPassword: user?.hasPassword ?? false,
      googleConnected: !!user?.googleId,
      googleEmail: user?.googleEmail ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      practicePreferences: user?.practicePreferences ?? [],
      moodThisWeek,
      stressAvg,
      isPremium,
      createdAt: user?.createdAt?.toISOString() ?? null,
    };
  }

  @Get('me')
  getMe(@Request() req: Req & { user: JwtUser }) {
    return this.buildProfile(req.user.userId);
  }

  @Patch('me')
  async updateMe(
    @Body() dto: UpdateMeDto,
    @Request() req: Req & { user: JwtUser },
  ) {
    await this.usersService.update(req.user.userId, dto as any);
    return this.buildProfile(req.user.userId);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: MAX_AVATAR_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_AVATAR_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Unsupported image format'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: MulterFile,
    @Request() req: Req & { user: JwtUser },
  ) {
    if (!file) throw new BadRequestException('avatar file is required');
    await this.usersService.replaceAvatar(req.user.userId, file, req);
    return this.buildProfile(req.user.userId);
  }

  @Post('me/email/request-change')
  requestEmailChange(
    @Body() dto: RequestEmailChangeDto,
    @Request() req: Req & { user: JwtUser },
  ) {
    return this.usersService.requestEmailChange(req.user.userId, dto, req);
  }

  @Post('me/email/confirm-change')
  async confirmEmailChange(
    @Body() dto: ConfirmEmailChangeDto,
    @Request() req: Req & { user: JwtUser },
  ) {
    const result = await this.usersService.confirmEmailChange(
      req.user.userId,
      dto,
      req,
    );
    const profile = await this.buildProfile(req.user.userId);
    return { ...result, profile };
  }
}
