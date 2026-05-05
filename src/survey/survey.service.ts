import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import type { Request } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { SurveySubmission } from './schemas/survey-submission.schema';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { UsersService } from '../users/users.service';
import { AuditLoggerService } from '../common/audit/audit-logger.service';

dayjs.extend(utc);
dayjs.extend(timezone);

const RECOMMENDATION_TEXT: Record<string, string> = {
  low: 'A gentle meditation or sleep session to maintain your calm.',
  medium: 'A focused meditation or emotional health practice to find balance.',
  high: 'A 10-minute anxiety relief exercise to help ease your stress.',
};

const CATEGORY_PRIORITY: Record<string, string[]> = {
  low: ['Meditation', 'Sleep'],
  medium: ['Meditation', 'Emotional health'],
  high: ['Anxiety Relief', 'Meditation'],
};

function getRecommendationTier(stress: number): 'low' | 'medium' | 'high' {
  if (stress <= 3) return 'low';
  if (stress <= 6) return 'medium';
  return 'high';
}

@Injectable()
export class SurveyService {
  constructor(
    @InjectModel(SurveySubmission.name)
    private readonly submissionModel: Model<SurveySubmission>,
    private readonly usersService: UsersService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  private async todayRange(userId: string) {
    const user = await this.usersService.findById(userId);
    const local = dayjs().tz(user?.timeZone ?? 'UTC');
    return {
      startOfDay: local.startOf('day').utc().toDate(),
      endOfDay: local.endOf('day').utc().toDate(),
      dateStr: local.format('YYYY-MM-DD'),
    };
  }

  async submit(dto: SubmitSurveyDto, userId: string, req: Request) {
    const { startOfDay, endOfDay } = await this.todayRange(userId);
    const userObjectId = new Types.ObjectId(userId);
    const fields = {
      stress: dto.stress,
      emotion: dto.emotion,
      sleepQuality: dto.sleepQuality,
      activity: dto.activity,
      submittedAt: new Date(),
    };

    // Upsert: update today's submission if it exists, otherwise create
    const existing = await this.submissionModel.findOneAndUpdate(
      {
        userId: userObjectId,
        context: 'daily',
        submittedAt: { $gte: startOfDay, $lt: endOfDay },
      },
      { $set: fields },
      { new: true },
    );

    const submission: SurveySubmission & { id: string } = existing
      ? (existing as any)
      : ((await this.submissionModel.create({
          userId: userObjectId,
          context: 'daily',
          ...fields,
        })) as any);

    const tier = getRecommendationTier(dto.stress);
    const categories = CATEGORY_PRIORITY[tier];

    let practiceId: string | null = null;
    try {
      const db = this.submissionModel.db;
      const practices = db.collection('practices');
      const [practice] = await practices
        .aggregate([
          { $match: { category: { $in: categories }, active: true } },
          { $sample: { size: 1 } },
        ])
        .toArray();
      if (practice) practiceId = practice._id.toString();
    } catch {
      // practices collection may not exist yet
    }

    await this.auditLogger.log({
      userId,
      action: 'survey.submitted',
      resource: 'survey',
      resourceId: submission.id,
      status: 'success',
      req,
    });

    return {
      id: submission.id,
      submittedAt: (submission as any).submittedAt,
      recommendation: { tier, text: RECOMMENDATION_TEXT[tier], practiceId },
    };
  }

  async getUserTimezone(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    return user?.timeZone ?? 'UTC';
  }

  getDb() {
    return this.submissionModel.db;
  }

  async aggregateByDay(
    userId: string,
    rangeStart: Date,
    rangeEnd: Date,
    tz: string,
  ) {
    return this.submissionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          submittedAt: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$submittedAt',
              timezone: tz,
            },
          },
          avgStress: { $avg: '$stress' },
          avgActivity: { $avg: '$activity' },
        },
      },
    ]);
  }

  async getWeeklyStats(userId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const submissions = await this.submissionModel
      .find({
        userId: new Types.ObjectId(userId),
        submittedAt: { $gte: since },
      })
      .lean();

    if (!submissions.length) return { moodThisWeek: null, stressAvg: null };

    const freq: Record<string, number> = {};
    for (const s of submissions) freq[s.emotion] = (freq[s.emotion] ?? 0) + 1;
    const moodThisWeek = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const stressAvg = +(
      submissions.reduce((sum, s) => sum + s.stress, 0) / submissions.length
    ).toFixed(1);

    return { moodThisWeek, stressAvg };
  }

  async getTodaySubmission(userId: string) {
    const { startOfDay, endOfDay, dateStr } = await this.todayRange(userId);

    const doc = await this.submissionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        context: 'daily',
        submittedAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .sort({ submittedAt: -1 });

    if (!doc) return { hasCheckIn: false as const };

    return {
      hasCheckIn: true as const,
      mood: doc.emotion,
      stressLevel: doc.stress,
      date: dateStr,
    };
  }
}
