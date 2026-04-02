import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhatsappVerificationChallengeInputDto } from './usecases/dto/whatsapp-verification-challenge.input';
import { WhatsappVerificationChallengeUsecase } from './usecases/whatsapp-verification-challenge.usecase';
import { ReceiveWhatsappMessageUsecase } from './usecases/receive-whatsapp-message.usecase';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappVerificationChallengeUsecase: WhatsappVerificationChallengeUsecase,
    private readonly receiveWhatsappMessageUsecase: ReceiveWhatsappMessageUsecase,
  ) {}

  @Get('webhook')
  verifyWebhook(@Query() query: WhatsappVerificationChallengeInputDto) {
    return this.whatsappVerificationChallengeUsecase.execute(query);
  }

  @Post('webhook')
  receiveMessage(@Body() body: any) {
    return this.receiveWhatsappMessageUsecase.execute(body);
  }
}
