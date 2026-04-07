import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../guards/admin-api-key.guard';
import { CreateOrganizationInputDto } from './usecases/dtos/create-organization-input.dto';
import { CreateOrganizationOutputDto } from './usecases/dtos/create-organization-output.dto';
import { InviteUserInputDto } from './usecases/dtos/invite-user-input.dto';
import { ListOrganizationsQueryDto } from './usecases/dtos/list-organizations-query.dto';
import { ListOrganizationsOutputDto } from './usecases/dtos/list-organizations-output.dto';
import { ListOrganizationUsersOutputDto } from './usecases/dtos/list-organization-users-output.dto';
import { ListOrganizationUsersQueryDto } from './usecases/dtos/list-organization-users-query.dto';
import { OrganizationDetailOutputDto } from './usecases/dtos/organization-detail-output.dto';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { GetOrganizationByIdUsecase } from './usecases/get-organization-by-id.usecase';
import { InviteUserUsecase } from './usecases/invite-user.usecase';
import { ListOrganizationUsersUsecase } from './usecases/list-organization-users.usecase';
import { ListOrganizationsUsecase } from './usecases/list-organizations.usecase';

@ApiTags('Organizações (admin)')
@ApiBearerAuth('admin-api-key')
@UseGuards(AdminApiKeyGuard)
@Controller()
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUsecase: CreateOrganizationUsecase,
    private readonly inviteUserUsecase: InviteUserUsecase,
    private readonly listOrganizationsUsecase: ListOrganizationsUsecase,
    private readonly getOrganizationByIdUsecase: GetOrganizationByIdUsecase,
    private readonly listOrganizationUsersUsecase: ListOrganizationUsersUsecase,
  ) {}

  @Get('admin/organizations')
  @ApiOperation({ summary: 'Listar organizações (paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filtra por nome (contém, case-insensitive)',
  })
  @ApiOkResponse({
    description: 'Lista paginada',
    type: ListOrganizationsOutputDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credencial ausente ou inválida' })
  async list(
    @Query() query: ListOrganizationsQueryDto,
  ): Promise<ListOrganizationsOutputDto> {
    return await this.listOrganizationsUsecase.execute(query);
  }

  @Get('admin/organizations/:organizationId/users')
  @ApiOperation({
    summary: 'Listar usuários da organização (paginado)',
    description:
      'Membros e convites pendentes (`accountStatus` = `pending_confirmation`) da organização. Sem `password` nem `confirmation`. O convite continua em `POST /organizations/:organizationId/invite-user`.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiOkResponse({
    description: 'Lista paginada de membros',
    type: ListOrganizationUsersOutputDto,
  })
  @ApiNotFoundResponse({ description: 'Organização não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Credencial ausente ou inválida' })
  @ApiResponse({ status: 400, description: 'ID de organização inválido' })
  async listOrganizationUsers(
    @Param('organizationId') organizationId: string,
    @Query() query: ListOrganizationUsersQueryDto,
  ): Promise<ListOrganizationUsersOutputDto> {
    return await this.listOrganizationUsersUsecase.execute(
      organizationId,
      query,
    );
  }

  @Get('admin/organizations/:organizationId')
  @ApiOperation({ summary: 'Obter organização por ID' })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Dados da organização',
    type: OrganizationDetailOutputDto,
  })
  @ApiNotFoundResponse({ description: 'Organização não encontrada' })
  @ApiUnauthorizedResponse({ description: 'Credencial ausente ou inválida' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  async getById(
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationDetailOutputDto> {
    return await this.getOrganizationByIdUsecase.execute(organizationId);
  }

  @Post('admin/organizations')
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar organização e usuário owner' })
  @ApiBody({ type: CreateOrganizationInputDto })
  @ApiResponse({
    status: 201,
    description: 'Organização e owner criados.',
    type: CreateOrganizationOutputDto,
  })
  @ApiUnauthorizedResponse({ description: 'Credencial ausente ou inválida' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() body: CreateOrganizationInputDto,
  ): Promise<CreateOrganizationOutputDto> {
    return await this.createOrganizationUsecase.execute(body);
  }

  @Post('organizations/:organizationId/invite-user')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Convidar usuário por e-mail',
    description:
      'Rota mantida fora de `/admin/...` por compatibilidade com integrações existentes; exige o mesmo auth admin (Bearer) das demais rotas protegidas.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: InviteUserInputDto })
  @ApiNoContentResponse({ description: 'Convite enviado' })
  @ApiUnauthorizedResponse({ description: 'Credencial ausente ou inválida' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
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
