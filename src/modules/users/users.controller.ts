import { Body, Controller, Patch } from '@nestjs/common';
import { ConfirmAccountInputDto } from './usecases/dtos/confirm-account-input.dto';
import { ConfirmAccountOutputDto } from './usecases/dtos/confirm-account-output.dto';
import { ConfirmAccountUsecase } from './usecases/confirm-account.usecase';

@Controller('users')
export class UsersController {
  constructor(private readonly confirmAccountUsecase: ConfirmAccountUsecase) {}

  @Patch('confirm-account')
  async confirmAccount(
    @Body() body: ConfirmAccountInputDto,
  ): Promise<ConfirmAccountOutputDto> {
    return await this.confirmAccountUsecase.execute(body);
  }
}
