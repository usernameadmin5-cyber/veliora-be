import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Practice } from './schemas/practice.schema';
import { QueryPracticesDto } from './dto/query-practices.dto';
import { UsersService } from '../users/users.service';
import { SurveyService } from '../survey/survey.service';

const PREF_CATEGORY_MAP: Record<string, string> = {
  Breathing: 'Anxiety Relief',
  Meditation: 'Meditation',
  Sleep: 'Sleep',
  'Emotional health': 'Emotional health',
  Affirmations: 'Emotional health',
  Focus: 'Meditation',
};

function basePriorityFromStress(stress: number): string[] {
  if (stress <= 3) return ['Meditation', 'Sleep'];
  if (stress <= 6) return ['Meditation', 'Emotional health'];
  return ['Anxiety Relief', 'Meditation'];
}

@Injectable()
export class PracticesService {
  constructor(
    @InjectModel(Practice.name) private readonly practiceModel: Model<Practice>,
    private readonly usersService: UsersService,
    private readonly surveyService: SurveyService,
  ) {}

  async getPractices(dto: QueryPracticesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const filter: Record<string, unknown> = { active: true };
    if (dto.category) filter.category = dto.category;

    const [items, total] = await Promise.all([
      this.practiceModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.practiceModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async getRecommended(userId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const db = this.surveyService.getDb();
    const [survey] = await db
      .collection('surveysubmissions')
      .find({
        userId: new Types.ObjectId(userId),
        submittedAt: { $gte: since },
      })
      .sort({ submittedAt: -1 })
      .limit(1)
      .toArray();

    const stress: number = survey?.stress ?? null;
    const basePriority =
      stress !== null ? basePriorityFromStress(stress) : ['Meditation'];

    const user = await this.usersService.findById(userId);
    const boosted = (user?.practicePreferences ?? [])
      .map((p: string) => PREF_CATEGORY_MAP[p])
      .filter(Boolean) as string[];

    const categories = [...new Set([...boosted, ...basePriority])];

    const practices = await this.practiceModel.aggregate([
      { $match: { active: true, category: { $in: categories } } },
      { $sample: { size: 4 } },
    ]);

    if (practices.length < 4) {
      const ids = practices.map((p) => p._id);
      const extra = await this.practiceModel.aggregate([
        { $match: { active: true, _id: { $nin: ids } } },
        { $sample: { size: 4 - practices.length } },
      ]);
      practices.push(...extra);
    }

    return { items: practices };
  }
}
