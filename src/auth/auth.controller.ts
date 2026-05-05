import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './decorators/current-user.decorator';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { GoogleConnectDto } from './dto/google-connect.dto';
import { GoogleProfile } from './strategies/google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  @ApiOperation({ summary: 'Register new account' })
  signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    return this.authService.signUp(dto, req);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(dto, req, res);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend OTP code' })
  resendOtp(@Body() dto: ResendOtpDto, @Req() req: Request) {
    return this.authService.resendOtp(dto, req);
  }

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email + password' })
  signIn(
    @Body() dto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, req, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('sign-out')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out' })
  signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.signOut(req, res, user.sub);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request forgot-password OTP' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req);
  }

  @Post('set-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set password (Google-only accounts)' })
  setPassword(
    @Body() dto: SetPasswordDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.authService.setPassword(dto, user.sub, req);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleAuth() {
    // Guard handles redirect
  }

  @Public()
  @Get('google/connect-init')
  @ApiOperation({
    summary:
      'Initiate Google connect flow for authenticated users (cookie-based)',
  })
  googleConnectInit(@Req() req: Request, @Res() res: Response) {
    return this.authService.initGoogleConnect(req, res);
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.authService.handleGoogleCallback(
      (req as any).user as GoogleProfile,
      req,
      res,
    );
  }

  @Post('google/connect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect Google account to existing user' })
  connectGoogle(
    @Body() dto: GoogleConnectDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.authService.connectGoogle(dto, user.sub, req);
  }

  @Post('google/disconnect')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google account' })
  disconnectGoogle(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return this.authService.disconnectGoogle(user.sub, req);
  }
}
