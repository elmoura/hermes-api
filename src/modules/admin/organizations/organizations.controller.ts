import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CreateOrganizationInputDto } from './usecases/dtos/create-organization-input.dto';
import { CreateOrganizationOutputDto } from './usecases/dtos/create-organization-output.dto';
import { InviteUserInputDto } from './usecases/dtos/invite-user-input.dto';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { InviteUserUsecase } from './usecases/invite-user.usecase';

@Controller()
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUsecase: CreateOrganizationUsecase,
    private readonly inviteUserUsecase: InviteUserUsecase,
  ) {}

  @Post('admin/organizations')
  @HttpCode(201)
  async create(
    @Body() body: CreateOrganizationInputDto,
  ): Promise<CreateOrganizationOutputDto> {
    return await this.createOrganizationUsecase.execute(body);
  }

  @Post('organizations/:organizationId/invite-user')
  @HttpCode(204)
  async inviteUser(
    @Param('organizationId') organizationId: string,
    @Body() body: InviteUserInputDto,
  ): Promise<void> {
    await this.inviteUserUsecase.execute({
      organizationId,
      email: body.email,
      role: body.role,
    });
  }
}
