import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RefreshToken extends Document {
  @Prop({ type: Types.ObjectId, required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) tokenHash: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() createdAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });
