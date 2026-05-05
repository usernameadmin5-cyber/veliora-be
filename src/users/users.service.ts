import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request } from 'express';
import type { File as MulterFile } from 'multer';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import Redis from 'ioredis';

import { User } from './schemas/user.schema';
import { OtpCode } from './schemas/otp-code.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { EmailService } from '../common/email/email.service';
import { AuditLoggerService } from '../common/audit/audit-logger.service';
import { StorageService } from '../common/storage/storage.service';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(OtpCode.name) private readonly otpModel: Model<OtpCode>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    private readonly emailService: EmailService,
    private readonly auditLogger: AuditLoggerService,
    private readonly storageService: StorageService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('+passwordHash').lean();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).lean();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .lean();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).lean();
  }

  async create(data: Partial<User>): Promise<User> {
    const user = new this.userModel(data);
    return user.save();
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
  }

  async updateEmail(id: string, newEmail: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { email: newEmail.toLowerCase() } },
        { new: true },
      )
      .lean();
  }

  // ─── Avatar ────────────────────────────────────────────────────────────────

  async replaceAvatar(
    userId: string,
    file: MulterFile,
    req: Request,
  ): Promise<string> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Store file; user id prefix ties every avatar file to its owner.
    const storedPath = await this.storageService.upload(file, 'avatars', {
      filenamePrefix: userId,
    });
    // storedPath is `/avatars/<userId>_<uuid>.<ext>`; prepend `/uploads`
    // so the URL matches the static-serve prefix set in main.ts.
    const publicUrl = `/uploads${storedPath}`;

    const previous = user.avatarUrl;
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { avatarUrl: publicUrl },
    });

    // Best-effort cleanup of the previous avatar file.
    if (previous && previous.startsWith('/uploads/avatars/')) {
      const relative = previous.replace(/^\/uploads/, '');
      await this.storageService.delete(relative).catch(() => undefined);
    }

    await this.auditLogger.log({
      userId,
      action: 'profile.avatar_updated',
      resource: 'user',
      status: 'success',
      req,
    });

    return publicUrl;
  }

  // ─── Email change flow ──────────────────────────────────────────────────────

  async requestEmailChange(
    userId: string,
    dto: RequestEmailChangeDto,
    req: Request,
  ): Promise<{ message: string }> {
    const rateKey = `emailchange:${userId}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) await this.redis.expire(rateKey, 600);
    if (count > 3)
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too many email change attempts. Try again in 10 minutes.',
        },
        429,
      );

    const user = await this.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.hasPassword || !user.passwordHash) {
      throw new ForbiddenException(
        'Set a local password before changing email',
      );
    }

    const passwordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      await this.auditLogger.log({
        userId,
        action: 'profile.email_change_requested',
        resource: 'user',
        status: 'failure',
        req,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const normalized = dto.newEmail.toLowerCase();
    if (normalized === user.email) {
      throw new BadRequestException('Email is unchanged');
    }

    const existing = await this.findByEmail(normalized);
    if (existing) throw new ConflictException('Email already in use');

    const code = randomInt(100000, 999999).toString();
    const hashed = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpModel.deleteMany({
      userId: new Types.ObjectId(userId),
      context: 'email-change',
      used: false,
    });
    await this.otpModel.create({
      email: normalized,
      code: hashed,
      context: 'email-change',
      expiresAt,
      used: false,
      userId: new Types.ObjectId(userId),
    });

    await this.emailService.sendOtp(normalized, code, 'email-change');
    await this.auditLogger.log({
      userId,
      action: 'profile.email_change_requested',
      resource: 'user',
      status: 'success',
      req,
      metadata: { newEmail: normalized },
    });

    return { message: `Verification code sent to ${normalized}` };
  }

  async confirmEmailChange(
    userId: string,
    dto: ConfirmEmailChangeDto,
    req: Request,
  ): Promise<{ email: string; message: string }> {
    const normalized = dto.newEmail.toLowerCase();

    const otpDoc = await this.otpModel.findOne({
      email: normalized,
      context: 'email-change',
      userId: new Types.ObjectId(userId),
      used: false,
    });
    if (!otpDoc) throw new UnauthorizedException('Invalid or expired code');
    if (otpDoc.expiresAt < new Date())
      throw new UnauthorizedException('Code has expired');

    const valid = await bcrypt.compare(dto.otp, otpDoc.code);
    if (!valid) {
      await this.auditLogger.log({
        userId,
        action: 'profile.email_changed',
        resource: 'user',
        status: 'failure',
        req,
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    // Race-check: someone might have taken this email during the 10-min window.
    const clash = await this.findByEmail(normalized);
    if (clash && clash._id.toString() !== userId)
      throw new ConflictException('Email already in use');

    await this.otpModel.findByIdAndUpdate(otpDoc._id, { used: true });
    const updated = await this.updateEmail(userId, normalized);
    if (!updated) throw new NotFoundException('User not found');

    // Revoke all refresh tokens so other sessions must re-authenticate.
    await this.refreshTokenModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    await this.auditLogger.log({
      userId,
      action: 'profile.email_changed',
      resource: 'user',
      status: 'success',
      req,
      metadata: { newEmail: normalized },
    });

    return { email: updated.email, message: 'Email updated' };
  }
}
