import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, default: null }) userId: Types.ObjectId | null;
  @Prop({ required: true }) action: string;
  @Prop({ required: true }) resource: string;
  @Prop({ type: String, default: null }) resourceId: string | null;
  @Prop({ type: Object, default: {} }) metadata: Record<string, unknown>;
  @Prop({ required: true }) ip: string;
  @Prop({ default: '' }) userAgent: string;
  @Prop({ enum: ['success', 'failure'], required: true }) status:
    | 'success'
    | 'failure';
  @Prop() createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
