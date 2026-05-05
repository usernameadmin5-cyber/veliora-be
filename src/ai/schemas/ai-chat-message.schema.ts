import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: false })
export class AiChatMessage extends Document {
  @Prop({ type: Types.ObjectId, required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true })
  conversationId: Types.ObjectId;
  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: string;
  @Prop({ required: true }) content: string;
  @Prop({
    type: {
      practiceId: { type: Types.ObjectId, default: null },
      title: { type: String, default: null },
      titleUk: { type: String, default: null },
      durationMin: { type: Number, default: null },
      category: { type: String, default: null },
      thumbnailUrl: { type: String, default: null },
      videoUrl: { type: String, default: null },
      gradient: { type: String, default: null },
    },
    default: null,
  })
  attachment: {
    practiceId: Types.ObjectId | null;
    title: string | null;
    titleUk: string | null;
    durationMin: number | null;
    category: string | null;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    gradient: string | null;
  } | null;
  @Prop({ default: Date.now }) sentAt: Date;
}

export const AiChatMessageSchema = SchemaFactory.createForClass(AiChatMessage);

AiChatMessageSchema.index({ userId: 1, conversationId: 1, sentAt: -1 });
