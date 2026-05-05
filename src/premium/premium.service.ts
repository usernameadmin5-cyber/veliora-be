import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Subscription } from './schemas/subscription.schema';

@Injectable()
export class PremiumService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async isPremium(userId: string): Promise<boolean> {
    const sub = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();
    return sub?.status === 'active' && sub.currentPeriodEnd > new Date();
  }

  async subscribe(plan: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    const existing = await this.subscriptionModel
      .findOne({ userId: uid, status: 'active' })
      .lean();
    if (existing && existing.currentPeriodEnd > new Date()) {
      throw new ConflictException('Already have an active subscription');
    }

    const now = new Date();
    const days =
      plan === 'monthly'
        ? Number(process.env['PREMIUM_MONTHLY_DAYS'] ?? 30)
        : Number(process.env['PREMIUM_YEARLY_DAYS'] ?? 365);
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const sub = await this.subscriptionModel.findOneAndUpdate(
      { userId: uid },
      {
        plan,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        updatedAt: now,
      },
      { upsert: true, new: true },
    );

    return {
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  async cancel(userId: string) {
    const uid = new Types.ObjectId(userId);
    const sub = await this.subscriptionModel
      .findOne({ userId: uid, status: 'active' })
      .lean();
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }

    const now = new Date();
    await this.subscriptionModel.findOneAndUpdate(
      { userId: uid },
      { status: 'cancelled', cancelledAt: now, updatedAt: now },
    );

    return {
      message: 'Subscription cancelled',
      cancelledAt: now.toISOString(),
    };
  }

  async getStatus(userId: string) {
    const uid = new Types.ObjectId(userId);
    const sub = await this.subscriptionModel.findOne({ userId: uid }).lean();
    const isPremium =
      sub?.status === 'active' && sub.currentPeriodEnd > new Date();

    if (!sub) {
      return {
        isPremium: false,
        plan: null,
        status: null,
        currentPeriodEnd: null,
      };
    }

    return {
      isPremium,
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }
}
