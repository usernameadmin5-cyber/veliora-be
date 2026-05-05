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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';
import { randomUUID } from 'crypto';
import axios from 'axios';

import { UsersService } from '../users/users.service';
import { OtpCode } from '../users/schemas/otp-code.schema';
import { RefreshToken } from '../users/schemas/refresh-token.schema';
import { AuditLoggerService } from '../common/audit/audit-logger.service';
import { EmailService } from '../common/email/email.service';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import { AppLogger } from '../common/logger/app-logger.service';
import Redis from 'ioredis';

import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { GoogleConnectDto } from './dto/google-connect.dto';
import { GoogleProfile } from './strategies/google.strategy';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogger: AuditLoggerService,
    private readonly emailService: EmailService,
    private readonly logger: AppLogger,
    @InjectModel(OtpCode.name) private readonly otpModel: Model<OtpCode>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.logger.setContext(AuthService.name);
  }

  // ─── Token helpers ──────────────────────────────────────────────────────────

  private signAccess(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '15m') as any,
      },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomUUID();
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.refreshTokenModel.create({ userId, tokenHash, expiresAt });
    return raw;
  }

  setRefreshCookie(res: Response, raw: string) {
    res.cookie(REFRESH_TOKEN_COOKIE, raw, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  // ─── OTP helpers ────────────────────────────────────────────────────────────

  private async generateAndSaveOtp(
    email: string,
    context: 'signup' | 'forgot-password',
    pendingHash?: string,
  ): Promise<string> {
    const code = randomInt(100000, 999999).toString();
    const hashed = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpModel.deleteMany({ email, context, used: false });
    await this.otpModel.create({
      email,
      code: hashed,
      context,
      expiresAt,
      used: false,
      pendingHash: pendingHash ?? null,
    });
    return code;
  }

  // ─── Sign-Up ─────────────────────────────────────────────────────────────────

  async signUp(dto: SignUpDto, req: Request): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersService.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      hasPassword: true,
      isVerified: false,
    });

    const otp = await this.generateAndSaveOtp(dto.email, 'signup');
    await this.emailService.sendOtp(dto.email, otp, 'signup');
    await this.auditLogger.log({
      action: 'auth.sign_up',
      resource: 'user',
      status: 'success',
      req,
    });

    return { message: `Verification code sent to ${dto.email}` };
  }

  // ─── Verify OTP ──────────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto, req: Request, res: Response) {
    const otpDoc = await this.otpModel.findOne({
      email: dto.email.toLowerCase(),
      context: dto.context,
      used: false,
    });
    if (!otpDoc) throw new UnauthorizedException('Invalid or expired code');
    if (otpDoc.expiresAt < new Date())
      throw new UnauthorizedException('Code has expired');

    const valid = await bcrypt.compare(dto.otp, otpDoc.code);
    if (!valid) throw new UnauthorizedException('Invalid verification code');

    await this.otpModel.findByIdAndUpdate(otpDoc._id, { used: true });
    await this.auditLogger.log({
      action: 'auth.otp_verified',
      resource: 'user',
      status: 'success',
      req,
    });

    if (dto.context === 'signup') {
      const user = await this.usersService.update(
        (await this.usersService.findByEmail(dto.email))!._id.toString(),
        { isVerified: true },
      );
      if (!user) throw new UnauthorizedException('User not found');

      const accessToken = this.signAccess(user._id.toString(), user.email);
      const rawRefresh = await this.createRefreshToken(user._id.toString());
      this.setRefreshCookie(res, rawRefresh);

      return {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          language: user.language ?? 'en',
        },
        message: 'Account verified',
      };
    }

    // forgot-password context: apply pending hash
    if (otpDoc.pendingHash) {
      const user = await this.usersService.findByEmail(dto.email);
      if (user) {
        await this.usersService.update(user._id.toString(), {
          passwordHash: otpDoc.pendingHash,
          hasPassword: true,
        });
      }
    }
    return { message: 'OTP verified — proceed to set new password' };
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────────

  async resendOtp(
    dto: ResendOtpDto,
    req: Request,
  ): Promise<{ message: string }> {
    const key = `otp:resend:${dto.email}:${dto.context}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 600);
    if (count > 3)
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too many resend attempts. Try again in 10 minutes.',
        },
        429,
      );

    const otp = await this.generateAndSaveOtp(dto.email, dto.context);
    await this.emailService.sendOtp(dto.email, otp, dto.context);

    return { message: 'Verification code resent' };
  }

  // ─── Sign-In ─────────────────────────────────────────────────────────────────

  async signIn(dto: SignInDto, req: Request, res: Response) {
    const ipKey = `signin:ip:${req.ip}`;
    const attempts = await this.redis.incr(ipKey);
    if (attempts === 1) await this.redis.expire(ipKey, 15 * 60);
    if (attempts > 5)
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Too many sign-in attempts. Try again later.',
        },
        429,
      );

    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.passwordHash) {
      await this.auditLogger.log({
        action: 'auth.sign_in_failed',
        resource: 'user',
        status: 'failure',
        req,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) throw new ForbiddenException('Email not verified');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.auditLogger.log({
        action: 'auth.sign_in_failed',
        resource: 'user',
        status: 'failure',
        req,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.del(ipKey);

    const accessToken = this.signAccess(user._id.toString(), user.email);
    const rawRefresh = await this.createRefreshToken(user._id.toString());
    this.setRefreshCookie(res, rawRefresh);
    await this.auditLogger.log({
      action: 'auth.sign_in',
      resource: 'user',
      userId: user._id.toString(),
      status: 'success',
      req,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        language: user.language ?? 'en',
      },
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(req: Request, res: Response) {
    const raw: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!raw) throw new UnauthorizedException('No refresh token');

    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const tokenDoc = await this.refreshTokenModel.findOne({ tokenHash });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    await this.refreshTokenModel.deleteOne({ _id: tokenDoc._id });

    const user = await this.usersService.findById(tokenDoc.userId.toString());
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.signAccess(user._id.toString(), user.email);
    const newRaw = await this.createRefreshToken(user._id.toString());
    this.setRefreshCookie(res, newRaw);

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        language: user.language ?? 'en',
      },
    };
  }

  // ─── Sign-Out ─────────────────────────────────────────────────────────────────

  async signOut(
    req: Request,
    res: Response,
    userId: string,
  ): Promise<{ message: string }> {
    const raw: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (raw) {
      const tokenHash = createHash('sha256').update(raw).digest('hex');
      await this.refreshTokenModel.deleteOne({ tokenHash });
    }
    this.clearRefreshCookie(res);
    await this.auditLogger.log({
      action: 'auth.sign_out',
      resource: 'user',
      userId,
      status: 'success',
      req,
    });
    return { message: 'Signed out' };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(
    dto: ForgotPasswordDto,
    req: Request,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findByEmail(dto.email);
    // Always return 200 to prevent email enumeration
    if (user) {
      const pendingHash = await bcrypt.hash(dto.newPassword, 12);
      const otp = await this.generateAndSaveOtp(
        dto.email,
        'forgot-password',
        pendingHash,
      );
      await this.emailService.sendOtp(dto.email, otp, 'forgot-password');
      await this.auditLogger.log({
        action: 'auth.forgot_password',
        resource: 'user',
        userId: user._id.toString(),
        status: 'success',
        req,
      });
    }

    return {
      message: `If an account exists for ${dto.email}, a reset code was sent`,
    };
  }

  // ─── Set Password ─────────────────────────────────────────────────────────────

  async setPassword(
    dto: SetPasswordDto,
    userId: string,
    req: Request,
  ): Promise<{ message: string }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersService.update(userId, { passwordHash, hasPassword: true });
    await this.auditLogger.log({
      action: 'auth.password_set',
      resource: 'user',
      userId,
      status: 'success',
      req,
    });
    return { message: 'Password set successfully' };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async initGoogleConnect(req: Request, res: Response) {
    const raw: string | undefined = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!raw) throw new UnauthorizedException('Not authenticated');

    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const tokenDoc = await this.refreshTokenModel.findOne({ tokenHash });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const nonce = randomUUID();
    await this.redis.set(
      `google_connect:${nonce}`,
      tokenDoc.userId.toString(),
      'EX',
      300,
    );

    res.cookie('google_connect_nonce', nonce, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    });

    const backendUrl =
      this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3001';
    res.redirect(`${backendUrl}/v1/auth/google`);
  }

  async handleGoogleCallback(
    profile: GoogleProfile,
    req: Request,
    res: Response,
  ) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    // ── Connect flow: nonce cookie present ──────────────────────────────────
    const nonce: string | undefined = req.cookies?.['google_connect_nonce'];
    if (nonce) {
      res.clearCookie('google_connect_nonce', { path: '/' });

      const userId = await this.redis.get(`google_connect:${nonce}`);
      if (!userId) {
        return res.redirect(`${frontendUrl}/profile?connected=error`);
      }
      await this.redis.del(`google_connect:${nonce}`);

      const googleId = profile.id;
      const googleEmail = profile.emails?.[0]?.value?.toLowerCase() ?? '';

      const existing = await this.usersService.findByGoogleId(googleId);
      if (existing && existing._id.toString() !== userId) {
        return res.redirect(`${frontendUrl}/profile?connected=conflict`);
      }

      await this.usersService.update(userId, { googleId, googleEmail });
      await this.auditLogger.log({
        action: 'auth.google_connected',
        resource: 'user',
        userId,
        status: 'success',
        req,
      });

      return res.redirect(`${frontendUrl}/profile?connected=1`);
    }

    // ── Standard login / register flow ──────────────────────────────────────
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase() ?? '';
    const name = profile.displayName;

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        await this.usersService.update(user._id.toString(), {
          googleId,
          googleEmail: email,
        });
        user = await this.usersService.findById(user._id.toString());
      } else {
        user = await this.usersService.create({
          name,
          email,
          googleId,
          googleEmail: email,
          hasPassword: false,
          isVerified: true,
        });
      }
    }

    await this.auditLogger.log({
      action: 'auth.sign_in',
      resource: 'user',
      userId: user!._id.toString(),
      status: 'success',
      req,
    });

    const accessToken = this.signAccess(user!._id.toString(), user!.email);
    const rawRefresh = await this.createRefreshToken(user!._id.toString());
    this.setRefreshCookie(res, rawRefresh);

    res.redirect(`${frontendUrl}/dashboard?token=${accessToken}`);
  }

  // ─── Google Connect ───────────────────────────────────────────────────────────

  async connectGoogle(dto: GoogleConnectDto, userId: string, req: Request) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${dto.googleToken}`;

    let googleId: string;
    let googleEmail: string;
    try {
      const { data } = await axios.get(tokenInfoUrl);
      if (data.aud !== clientId) throw new Error('Token audience mismatch');
      googleId = data.sub;
      googleEmail = data.email;
    } catch {
      throw new BadRequestException('Invalid Google token');
    }

    const existing = await this.usersService.findByGoogleId(googleId);
    if (existing && existing._id.toString() !== userId) {
      throw new ConflictException(
        'Google account already linked to another user',
      );
    }

    await this.usersService.update(userId, { googleId, googleEmail });
    await this.auditLogger.log({
      action: 'auth.google_connected',
      resource: 'user',
      userId,
      status: 'success',
      req,
    });

    return { message: 'Google account connected', googleEmail };
  }

  // ─── Google Disconnect ────────────────────────────────────────────────────────

  async disconnectGoogle(
    userId: string,
    req: Request,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.hasPassword) {
      throw new ForbiddenException(
        'You must set a password before disconnecting Google',
      );
    }
    await this.usersService.update(userId, {
      googleId: null,
      googleEmail: null,
    });
    await this.auditLogger.log({
      action: 'auth.google_disconnected',
      resource: 'user',
      userId,
      status: 'success',
      req,
    });
    return { message: 'Google account disconnected' };
  }
}
