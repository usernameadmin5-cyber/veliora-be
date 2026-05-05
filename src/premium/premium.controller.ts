import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { PremiumService } from './premium.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { AuditLoggerService } from '../common/audit/audit-logger.service';

@Controller('premium')
export class PremiumController {
  constructor(
    private readonly premiumService: PremiumService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto, @Request() req: any) {
    const result = await this.premiumService.subscribe(
      dto.plan,
      req.user.userId,
    );
    await this.auditLogger.log({
      userId: req.user.userId,
      action: 'premium.subscribe',
      resource: 'subscription',
      metadata: { plan: dto.plan },
      status: 'success',
      req,
    });
    return result;
  }

  @Post('cancel')
  async cancel(@Request() req: any) {
    const result = await this.premiumService.cancel(req.user.userId);
    await this.auditLogger.log({
      userId: req.user.userId,
      action: 'premium.cancel',
      resource: 'subscription',
      status: 'success',
      req,
    });
    return result;
  }

  @Get('status')
  getStatus(@Request() req: any) {
    return this.premiumService.getStatus(req.user.userId);
  }
}
