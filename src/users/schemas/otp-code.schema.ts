import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class OtpCode extends Document {
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) code: string;
  @Prop({ enum: ['signup', 'forgot-password', 'email-change'], required: true })
  context: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: false }) used: boolean;
  @Prop({ type: String, default: null }) pendingHash: string | null;
  @Prop({ type: Types.ObjectId, default: null }) userId: Types.ObjectId | null;
  @Prop() createdAt: Date;
}

export const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);

OtpCodeSchema.index({ email: 1, context: 1 });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
