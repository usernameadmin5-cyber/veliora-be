import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Practice } from '../practices/schemas/practice.schema';
import { ResetTip } from '../dashboard/schemas/reset-tip.schema';
import { SurveySubmission } from '../survey/schemas/survey-submission.schema';
import { UpsertPracticeDto } from './dto/upsert-practice.dto';
import { UpsertResetDto } from './dto/upsert-reset.dto';
import { UpsertSurveyDto } from './dto/upsert-survey.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Practice.name) private readonly practiceModel: Model<Practice>,
    @InjectModel(ResetTip.name) private readonly resetTipModel: Model<ResetTip>,
    @InjectModel(SurveySubmission.name)
    private readonly surveyModel: Model<SurveySubmission>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Auth ───────────────────────────────────────────────────────────────────

  login(username: string, password: string): { accessToken: string } {
    const envUser = this.config.get<string>('ADMIN_USERNAME');
    const envPass = this.config.get<string>('ADMIN_PASSWORD');
    if (!envUser || !envPass || username !== envUser || password !== envPass) {
      throw new UnauthorizedException('Invalid admin credentials');
    }
    const token = this.jwtService.sign(
      { sub: 'admin', role: 'admin' },
      {
        secret:
          this.config.get<string>('ADMIN_JWT_SECRET') ??
          'admin-fallback-secret',
        expiresIn: '8h',
      },
    );
    return { accessToken: token };
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  async verifyUser(userId: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        new Types.ObjectId(userId),
        { $set: { isVerified: true } },
        { new: true },
      )
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(userId: string) {
    const result = await this.userModel.findByIdAndDelete(
      new Types.ObjectId(userId),
    );
    if (!result) throw new NotFoundException('User not found');
    return { deleted: true };
  }

  // ── Practices ─────────────────────────────────────────────────────────────

  async getPractices(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.practiceModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.practiceModel.countDocuments(),
    ]);
    return { items, total, page, limit };
  }

  async createPractice(dto: UpsertPracticeDto) {
    const practice = new this.practiceModel({
      ...dto,
      active: dto.active ?? true,
    });
    return practice.save();
  }

  async updatePractice(id: string, dto: UpsertPracticeDto) {
    const practice = await this.practiceModel
      .findByIdAndUpdate(new Types.ObjectId(id), { $set: dto }, { new: true })
      .lean();
    if (!practice) throw new NotFoundException('Practice not found');
    return practice;
  }

  async deletePractice(id: string) {
    const result = await this.practiceModel.findByIdAndDelete(
      new Types.ObjectId(id),
    );
    if (!result) throw new NotFoundException('Practice not found');
    return { deleted: true };
  }

  // ── Reset tips ────────────────────────────────────────────────────────────

  async getResetTips() {
    return this.resetTipModel.find().sort({ _id: 1 }).lean();
  }

  async createResetTip(dto: UpsertResetDto) {
    const tip = new this.resetTipModel(dto);
    return tip.save();
  }

  async updateResetTip(id: string, dto: UpsertResetDto) {
    const tip = await this.resetTipModel
      .findByIdAndUpdate(new Types.ObjectId(id), { $set: dto }, { new: true })
      .lean();
    if (!tip) throw new NotFoundException('Reset tip not found');
    return tip;
  }

  async deleteResetTip(id: string) {
    const result = await this.resetTipModel.findByIdAndDelete(
      new Types.ObjectId(id),
    );
    if (!result) throw new NotFoundException('Reset tip not found');
    return { deleted: true };
  }

  // ── Surveys ───────────────────────────────────────────────────────────────

  async getUserSurveys(userId: string) {
    const items = await this.surveyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ submittedAt: -1 })
      .lean();
    return items;
  }

  async createSurvey(userId: string, dto: UpsertSurveyDto) {
    const survey = new this.surveyModel({
      ...dto,
      context: 'daily',
      userId: new Types.ObjectId(userId),
      submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : new Date(),
    });
    return survey.save();
  }

  async updateSurvey(id: string, dto: UpsertSurveyDto) {
    const survey = await this.surveyModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          $set: {
            ...dto,
            context: 'daily',
            ...(dto.submittedAt
              ? { submittedAt: new Date(dto.submittedAt) }
              : {}),
          },
        },
        { new: true },
      )
      .lean();
    if (!survey) throw new NotFoundException('Survey not found');
    return survey;
  }

  async deleteSurvey(id: string) {
    const result = await this.surveyModel.findByIdAndDelete(
      new Types.ObjectId(id),
    );
    if (!result) throw new NotFoundException('Survey not found');
    return { deleted: true };
  }
}
