import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, minlength: 2, maxlength: 100 }) name: string;
  @Prop({ required: true, lowercase: true }) email: string;
  @Prop({ type: String, select: false, default: null }) passwordHash:
    | string
    | null;
  @Prop({ default: false }) hasPassword: boolean;
  @Prop({ type: String, default: null }) googleId: string | null;
  @Prop({ type: String, default: null }) googleEmail: string | null;
  @Prop({ type: String, enum: ['en', 'uk'], default: 'en' }) language:
    | 'en'
    | 'uk';
  @Prop({ default: 'UTC' }) timeZone: string;
  @Prop({ type: Number, default: null }) age: number | null;
  @Prop({ type: String, default: null }) avatarUrl: string | null;
  @Prop({ type: [String], default: [] }) practicePreferences: string[];
  @Prop({ default: false }) isVerified: boolean;
  @Prop() createdAt: Date;
  @Prop() updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true, unique: true });
