import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;
  @Prop({ required: true, enum: ['monthly', 'yearly'] }) plan: string;
  @Prop({ required: true, enum: ['active', 'cancelled'] }) status: string;
  @Prop({ required: true }) currentPeriodStart: Date;
  @Prop({ required: true }) currentPeriodEnd: Date;
  @Prop({ type: Date, default: null }) cancelledAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ userId: 1 }, { unique: true });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
