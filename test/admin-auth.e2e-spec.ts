import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Admin API key (e2e)', () => {
  let app: INestApplication<App>;
  const adminKey = 'e2e-admin-api-key';

  beforeEach(async () => {
    process.env.ADMIN_API_KEY = adminKey;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /admin/organizations sem Authorization → 401', () => {
    return request(app.getHttpServer())
      .post('/admin/organizations')
      .send({})
      .expect(401);
  });

  it('POST /admin/organizations com Bearer incorreto → 401', () => {
    return request(app.getHttpServer())
      .post('/admin/organizations')
      .set('Authorization', 'Bearer wrong')
      .send({})
      .expect(401);
  });

  it('POST /admin/organizations com Bearer válido e body inválido → 400 (guard passou)', () => {
    return request(app.getHttpServer())
      .post('/admin/organizations')
      .set('Authorization', `Bearer ${adminKey}`)
      .send({})
      .expect(400);
  });

  it('POST /organizations/:id/invite-user sem Authorization → 401', () => {
    return request(app.getHttpServer())
      .post('/organizations/507f1f77bcf86cd799439011/invite-user')
      .send({ email: 'a@b.com' })
      .expect(401);
  });

  it('POST /organizations/:id/invite-user com Bearer válido e body inválido → 400', () => {
    return request(app.getHttpServer())
      .post('/organizations/507f1f77bcf86cd799439011/invite-user')
      .set('Authorization', `Bearer ${adminKey}`)
      .send({})
      .expect(400);
  });

  it('GET /admin/organizations/:id/users sem Authorization → 401', () => {
    return request(app.getHttpServer())
      .get('/admin/organizations/507f1f77bcf86cd799439011/users')
      .expect(401);
  });

  it('GET /admin/organizations/:id/users com Bearer e org inexistente → 404', () => {
    return request(app.getHttpServer())
      .get('/admin/organizations/507f1f77bcf86cd799439011/users')
      .set('Authorization', `Bearer ${adminKey}`)
      .expect(404);
  });

  it('GET /admin/organizations/:id/users com Bearer e id inválido → 400', () => {
    return request(app.getHttpServer())
      .get('/admin/organizations/invalid-id/users')
      .set('Authorization', `Bearer ${adminKey}`)
      .expect(400);
  });

  const tenantOrgId = '507f1f77bcf86cd799439011';
  const tenantUserId = '507f1f77bcf86cd799439012';

  it('PATCH /organizations/:orgId/members/:userId sem Authorization → 401', () => {
    return request(app.getHttpServer())
      .patch(`/organizations/${tenantOrgId}/members/${tenantUserId}`)
      .send({ role: 'admin' })
      .expect(401);
  });

  it('PATCH /organizations/:orgId/members/:userId com API key staff (sem JWT tenant) → 401', () => {
    return request(app.getHttpServer())
      .patch(`/organizations/${tenantOrgId}/members/${tenantUserId}`)
      .set('Authorization', `Bearer ${adminKey}`)
      .send({ role: 'admin' })
      .expect(401);
  });

  it('DELETE /organizations/:orgId/members/:userId sem Authorization → 401', () => {
    return request(app.getHttpServer())
      .delete(`/organizations/${tenantOrgId}/members/${tenantUserId}`)
      .expect(401);
  });

  it('DELETE /organizations/:orgId/members/:userId com API key staff (sem JWT tenant) → 401', () => {
    return request(app.getHttpServer())
      .delete(`/organizations/${tenantOrgId}/members/${tenantUserId}`)
      .set('Authorization', `Bearer ${adminKey}`)
      .expect(401);
  });
});
