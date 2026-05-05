import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'resettips' })
export class ResetTip extends Document {
  @Prop({ required: true }) en: string;
  @Prop({ required: true }) uk: string;
}

export const ResetTipSchema = SchemaFactory.createForClass(ResetTip);
