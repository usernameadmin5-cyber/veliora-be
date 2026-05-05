import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Request } from 'express';
import { AuditLog } from './audit-log.schema';

export interface AuditEventPayload {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  status: 'success' | 'failure';
  req: Request;
}

@Injectable()
export class AuditLoggerService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async log(payload: AuditEventPayload): Promise<void> {
    await this.auditLogModel.create({
      userId: payload.userId ?? null,
      action: payload.action,
      resource: payload.resource,
      resourceId: payload.resourceId ?? null,
      metadata: payload.metadata ?? {},
      ip: payload.req.ip ?? payload.req.socket?.remoteAddress ?? 'unknown',
      userAgent: payload.req.headers['user-agent'] ?? '',
      status: payload.status,
    });
  }
}
