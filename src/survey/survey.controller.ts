import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SurveyService } from './survey.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Survey')
@ApiBearerAuth()
@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit onboarding or daily survey' })
  submit(
    @Body() dto: SubmitSurveyDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.surveyService.submit(dto, user.sub, req);
  }
}
