import { InvalidDataException } from '@modules/users/exceptions/invalid-data.exception';
import { WhatsappVerificationChallengeInputDto } from './dto/whatsapp-verification-challenge.input';
import { config } from '@config/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappVerificationChallengeUsecase {
  constructor() {}

  execute(input: WhatsappVerificationChallengeInputDto): string {
    const mode = input['hub.mode']?.toString();
    const challenge = input['hub.challenge']?.toString();
    const token = input['hub.verify_token']?.toString();

    const verificationToken = config.whatsapp.verificationToken;
    console.log({ verificationToken });
    console.log({ input });
    console.log('comparing:', verificationToken === token);

    if (!mode || !token) {
      throw new InvalidDataException('Error verifying token');
    }

    if (mode === 'subscribe' && token === verificationToken) {
      return challenge;
    }

    throw new InvalidDataException('Error verifying token');
  }
}
