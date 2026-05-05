import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import { SurveyService } from '../survey/survey.service';
import { PremiumService } from '../premium/premium.service';
import { AppLogger } from '../common/logger/app-logger.service';
import { StartPracticeDto } from './dto/start-practice.dto';
import { ResetTip } from './schemas/reset-tip.schema';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

function dayIndex(dateStr: string): number {
  return dayjs(dateStr).day();
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly premiumService: PremiumService,
    private readonly logger: AppLogger,
    @InjectModel(ResetTip.name) private readonly resetTipModel: Model<ResetTip>,
  ) {
    this.logger.setContext('DashboardService');
  }

  getTodayCheckIn(userId: string) {
    return this.surveyService.getTodaySubmission(userId);
  }

  async getWeeklyProgress(userId: string, queryTz?: string, weekStart?: string) {
    const user = await this.surveyService.getUserTimezone(userId);
    const tz = queryTz || user || 'UTC';

    let anchor = dayjs().tz(tz);
    if (weekStart) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        throw new BadRequestException('weekStart must be YYYY-MM-DD');
      }
      const parsed = dayjs.tz(weekStart, tz);
      if (!parsed.isValid()) {
        throw new BadRequestException('weekStart is not a valid date');
      }
      anchor = parsed;
    }

    // Clamp future selections to the current ISO week.
    const currentMonday = dayjs().tz(tz).startOf('isoWeek');
    let monday = anchor.startOf('isoWeek');
    if (monday.isAfter(currentMonday)) {
      monday = currentMonday;
    }

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(monday.add(i, 'day').format('YYYY-MM-DD'));
    }

    const rangeStart = monday.startOf('day').utc().toDate();
    const rangeEnd = monday.add(6, 'day').endOf('day').utc().toDate();

    const results = await this.surveyService.aggregateByDay(
      userId,
      rangeStart,
      rangeEnd,
      tz,
    );
    const byDate = new Map(results.map((r: any) => [r._id, r]));

    const isPremium = await this.premiumService.isPremium(userId);

    if (!isPremium) {
      return {
        tier: 'free' as const,
        data: days.map((d) => ({
          dayIndex: dayIndex(d),
          value: byDate.has(d)
            ? Math.round((byDate.get(d) as any).avgStress)
            : null,
        })),
      };
    }

    const values = days.map((d) => byDate.get(d)).filter(Boolean) as any[];
    const avgStress = values.length
      ? +(
          values.reduce((s: number, v: any) => s + v.avgStress, 0) /
          values.length
        ).toFixed(1)
      : null;
    const avgActivity = values.length
      ? +(
          values.reduce((s: number, v: any) => s + v.avgActivity, 0) /
          values.length
        ).toFixed(1)
      : null;

    return {
      tier: 'premium' as const,
      data: days.map((d) => ({
        dayIndex: dayIndex(d),
        stress: byDate.has(d)
          ? Math.round((byDate.get(d) as any).avgStress)
          : null,
        activity: byDate.has(d)
          ? Math.round((byDate.get(d) as any).avgActivity)
          : null,
      })),
      avgStress,
      avgActivity,
    };
  }

  async startPractice(dto: StartPracticeDto, userId: string) {
    const db = this.surveyService.getDb();
    const practice = await db
      .collection('practices')
      .findOne({ _id: new Types.ObjectId(dto.practiceId), active: true });

    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    const sessionId = randomUUID();
    this.logger.log('Practice session started', {
      userId,
      practiceId: dto.practiceId,
      sessionId,
    });
    return { message: 'Session started', sessionId };
  }

  async getRandomResetTip(lang: string): Promise<{ tip: string }> {
    const [doc] = await this.resetTipModel.aggregate([
      { $sample: { size: 1 } },
    ]);
    if (!doc) return { tip: '' };
    const tip = lang === 'uk' ? doc.uk : doc.en;
    return { tip };
  }

  startSmallReset() {
    return { message: 'Small reset session started', sessionId: randomUUID() };
  }
}
