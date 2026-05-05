import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Practice extends Document {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) titleUk: string;
  @Prop({ required: true }) durationMin: number;
  @Prop({
    type: String,
    enum: ['Anxiety Relief', 'Meditation', 'Sleep', 'Emotional health'],
    required: true,
  })
  category: string;
  @Prop({ type: String, default: null }) thumbnailUrl: string | null;
  @Prop({ type: String, default: null }) videoUrl: string | null;
  @Prop({ required: true }) gradient: string;
  @Prop({ default: true }) active: boolean;
  @Prop() createdAt: Date;
}

export const PracticeSchema = SchemaFactory.createForClass(Practice);

PracticeSchema.index({ category: 1 });
PracticeSchema.index({ active: 1 });
