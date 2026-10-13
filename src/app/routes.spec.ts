import { Route, Routes } from '@angular/router';
import { routes } from './app.routes';
import { applicationsRoutes } from '@app/features/applications/applications.routes';
import { auditRoutes } from '@app/features/audit/audit.routes';
import { authRoutes } from '@app/features/auth/auth.routes';
import { contactTypesRoutes } from '@app/features/contact-types/contact-types.routes';
import { contactsRoutes } from '@app/features/contacts/contacts.routes';
import { featuresMgmtRoutes } from '@app/features/features-mgmt/features-mgmt.routes';
import { iamRoutes } from '@app/features/iam/iam.routes';
import { noticeTypesRoutes } from '@app/features/notice-types/notice-types.routes';
import { peopleRoutes } from '@app/features/people/people.routes';
import { reportsRoutes } from '@app/features/reports/reports.routes';
import { rolesRoutes } from '@app/features/roles/roles.routes';
import { serviceTypesRoutes } from '@app/features/service-types/service-types.routes';
import { usersRoutes } from '@app/features/users/users.routes';

async function resolveAll(list: Routes, found: string[] = [], prefix = ''): Promise<string[]> {
  for (const route of list as Route[]) {
    const path = [prefix === '/' ? '' : prefix, route.path].filter(Boolean).join('/').replace(/^(?!\/)/, '/');
    if (route.loadComponent) {
      const component = await route.loadComponent();
      expect(component).toBeTruthy(`component for ${path}`);
      found.push(path);
    }
    if (route.loadChildren) {
      const children = (await route.loadChildren()) as Routes;
      await resolveAll(children, found, path);
    }
    if (route.children) await resolveAll(route.children, found, path);
  }
  return found;
}

describe('route configuration', () => {
  it('lazy-loads every page of the app', async () => {
    const found = await resolveAll(routes);
    for (const expected of [
      '/auth/login',
      '/forbidden',
      '/dashboard',
      '/people',
      '/contacts',
      '/features',
      '/iam',
      '/reports',
      '/audit',
      '/contact-types',
      '/applications',
      '/service-types',
      '/notice-types',
      '/applications/:applicationId/users',
      '/applications/:applicationId/roles',
      '/applications/:applicationId/managed-clients',
      '/applications/:applicationId/notices',
    ]) {
      expect(found).toContain(expected);
    }
  });

  it('resolves each feature route table on its own', async () => {
    for (const table of [
      applicationsRoutes,
      auditRoutes,
      authRoutes,
      contactTypesRoutes,
      contactsRoutes,
      featuresMgmtRoutes,
      iamRoutes,
      noticeTypesRoutes,
      peopleRoutes,
      reportsRoutes,
      rolesRoutes,
      serviceTypesRoutes,
      usersRoutes,
    ]) {
      expect((await resolveAll(table)).length).toBeGreaterThan(0);
    }
  });

  it('protects the shell with the auth guard and redirects unknown urls', () => {
    const shell = routes.find((r) => r.path === '')!;
    expect(shell.canActivate?.length).toBe(1);
    expect(routes.at(-1)).toEqual({ path: '**', redirectTo: 'dashboard' });
    expect(routes.find((r) => r.path === 'users')).toBeUndefined();
    const redirects = shell.children!.filter((r) => r.redirectTo);
    expect(redirects.map((r) => r.path)).toContain('users');
  });
});
