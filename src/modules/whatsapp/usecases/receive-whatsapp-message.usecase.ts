import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiveWhatsappMessageUsecase {
  constructor() {}

  execute(input: any) {
    return input;
  }
}
