import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: false })
export class SurveySubmission extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 10 }) stress: number;
  @Prop({
    required: true,
    enum: ['Calm', 'Anxious', 'Tired', 'Motivated', 'Overwhelmed', 'Neutral'],
  })
  emotion: string;
  @Prop({ required: true, enum: ['Poor', 'Okay', 'Good'] })
  sleepQuality: string;
  @Prop({ required: true, min: 1, max: 10 }) activity: number;
  @Prop({ required: true, enum: ['onboarding', 'daily'] }) context: string;
  @Prop({ default: Date.now }) submittedAt: Date;
}

export const SurveySubmissionSchema =
  SchemaFactory.createForClass(SurveySubmission);

SurveySubmissionSchema.index({ userId: 1, submittedAt: -1 });
