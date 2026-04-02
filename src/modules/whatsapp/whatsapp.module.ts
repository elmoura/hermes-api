import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappVerificationChallengeUsecase } from './usecases/whatsapp-verification-challenge.usecase';
import { ReceiveWhatsappMessageUsecase } from './usecases/receive-whatsapp-message.usecase';

@Module({
  imports: [],
  controllers: [WhatsappController],
  providers: [
    WhatsappVerificationChallengeUsecase,
    ReceiveWhatsappMessageUsecase,
  ],
})
export class WhatsappModule {}
