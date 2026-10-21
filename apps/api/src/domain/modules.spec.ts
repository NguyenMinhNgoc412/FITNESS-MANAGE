import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { BookingsController } from './bookings.controller';
import { PeopleController } from './people.controller';
import { CustomersController } from './customers.controller';
import { MembershipsController } from './memberships.controller';
import { CheckinsController } from './checkins.controller';
import { ExternalPtController } from './external-pt.controller';
import { ReportsController } from './reports.controller';
import { SalesAlertsController } from './sales-alerts.controller';
import { DashboardController } from './dashboard.controller';
import { AuditController } from './audit.controller';
import { DeviceTokensController } from './device-tokens.controller';
import { CheckinsService } from './checkins.service';
import { ExternalPtService } from './external-pt.service';
import { BookingsService } from './bookings.service';
import { PeopleService } from './people.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { SalesAlertsScheduler } from './sales-alerts.scheduler';

describe('Domain module wiring and route authorization', () => {
  it('resolves the complete Nest dependency graph without a database connection', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue({}).compile();
    expect(module.get(BookingsController)).toBeDefined();
    expect(module.get(ExternalPtController)).toBeDefined();
    await module.close();
  });
  it('keeps every domain route guarded with explicit roles and unique method/path', () => {
    const routes = new Set<string>();
    for (const controller of [BookingsController, PeopleController, CustomersController, MembershipsController, CheckinsController, ExternalPtController, ReportsController, SalesAlertsController, DashboardController, AuditController, DeviceTokensController]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([JwtAuthGuard, RolesGuard]);
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        if (name === 'constructor') continue;
        const handler = controller.prototype[name as keyof typeof controller.prototype];
        const path = Reflect.getMetadata(PATH_METADATA, handler);
        if (path === undefined) continue;
        expect(Reflect.getMetadata('roles', handler)?.length).toBeGreaterThan(0);
        const route = Reflect.getMetadata(METHOD_METADATA, handler) + ':' + path;
        expect(routes.has(route)).toBe(false);
        routes.add(route);
      }
    }
    for (const name of ['book', 'editBooking', 'cancelBooking'] as const) expect(Reflect.getMetadata('roles', BookingsController.prototype[name])).toEqual([Role.OWNER]);
    for (const name of ['assign', 'changeAssignment', 'unassign'] as const) expect(Reflect.getMetadata('roles', PeopleController.prototype[name])).toEqual([Role.OWNER]);
    expect(routes.size).toBe(50);
  });
  it('dispatches self routes before dynamic ids and rejects PT/Member mutations over HTTP', async () => {
    let role: Role = Role.PT;
    const checkins = { attendance: jest.fn().mockResolvedValue({ source: 'self-attendance' }) };
    const external = { list: jest.fn().mockResolvedValue({ source: 'self-passes' }) };
    const bookings = { save: jest.fn() }, people = { assign: jest.fn() };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(CheckinsService).useValue(checkins)
      .overrideProvider(ExternalPtService).useValue(external)
      .overrideProvider(BookingsService).useValue(bookings)
      .overrideProvider(PeopleService).useValue(people)
      .overrideProvider(NotificationsScheduler).useValue({})
      .overrideProvider(SalesAlertsScheduler).useValue({})
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (ctx: ExecutionContext) => {
        ctx.switchToHttp().getRequest().user = { sub: 'synthetic-user', sessionId: 'synthetic-session', role };
        return true;
      } }).compile();
    const app = module.createNestApplication({ logger: false });
    try {
      await app.listen(0, '127.0.0.1');
      const base = await app.getUrl();
      const request = (path: string, method = 'GET') => fetch(base + path, { method, signal: AbortSignal.timeout(5000) });
      expect(await (await request('/pt/me/attendance')).json()).toEqual({ source: 'self-attendance' });
      expect(checkins.attendance).toHaveBeenCalledWith(expect.objectContaining({ role: Role.PT }), undefined, undefined);
      role = Role.MEMBER;
      expect(await (await request('/members/me/external-pt-passes')).json()).toEqual({ source: 'self-passes' });
      expect(external.list).toHaveBeenCalledWith(expect.objectContaining({ sub: 'synthetic-user' }), 'synthetic-user');
      for (role of [Role.PT, Role.MEMBER]) {
        expect((await request('/checkins/pt', 'POST')).status).toBe(403);
        expect((await request('/pt/me/checkin', 'POST')).status).toBe(404);
        expect((await request('/bookings', 'POST')).status).toBe(403);
        expect((await request('/members/synthetic-id/pt-assignment', 'POST')).status).toBe(403);
        expect((await request('/reports/packages')).status).toBe(403);
        expect((await request('/customers/synthetic-id')).status).toBe(403);
        expect((await request('/customers/synthetic-id/checkins')).status).toBe(403);
      }
      expect(bookings.save).not.toHaveBeenCalled();
      expect(people.assign).not.toHaveBeenCalled();
    } finally { await app.close(); }
  }, 30000);
});
