import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription } from '../schemas/subscription.schema';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class RenewalTask {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subModel: Model<Subscription>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RenewalTask.name);
  }

  @Cron('5 0 * * *') // 00:05 UTC daily
  async renewExpiredSubscriptions() {
    const start = Date.now();
    try {
      const now = new Date();
      const cursor = this.subModel
        .find({ status: 'active', currentPeriodEnd: { $lte: now } })
        .cursor();

      let renewed = 0;
      for await (const sub of cursor) {
        const newStart = sub.currentPeriodEnd;
        const days = sub.plan === 'monthly' ? 30 : 365;
        const newEnd = new Date(
          newStart.getTime() + days * 24 * 60 * 60 * 1000,
        );

        await this.subModel.updateOne(
          { _id: sub._id },
          {
            currentPeriodStart: newStart,
            currentPeriodEnd: newEnd,
            updatedAt: now,
          },
        );
        renewed++;
      }

      this.logger.log('Subscription renewal complete', {
        renewed,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      this.logger.error('Subscription renewal failed', err, {
        durationMs: Date.now() - start,
      });
    }
  }
}
