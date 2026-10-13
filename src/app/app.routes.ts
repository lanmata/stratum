import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('@shared/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      { path: 'users', redirectTo: 'applications', pathMatch: 'full' },
      { path: 'roles', redirectTo: 'applications', pathMatch: 'full' },
      {
        path: 'people',
        data: { breadcrumb: 'Personas' },
        loadChildren: () => import('./features/people/people.routes').then((m) => m.peopleRoutes),
      },
      {
        path: 'contacts',
        data: { breadcrumb: 'Contactos' },
        loadChildren: () => import('./features/contacts/contacts.routes').then((m) => m.contactsRoutes),
      },
      {
        path: 'features',
        data: { breadcrumb: 'Features' },
        loadChildren: () =>
          import('./features/features-mgmt/features-mgmt.routes').then((m) => m.featuresMgmtRoutes),
      },
      {
        path: 'iam',
        data: { breadcrumb: 'Herramientas IAM' },
        loadChildren: () => import('./features/iam/iam.routes').then((m) => m.iamRoutes),
      },
      {
        path: 'reports',
        data: { breadcrumb: 'Reportes' },
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.reportsRoutes),
      },
      {
        path: 'audit',
        data: { breadcrumb: 'Auditoría' },
        loadChildren: () => import('./features/audit/audit.routes').then((m) => m.auditRoutes),
      },
      {
        path: 'contact-types',
        data: { breadcrumb: 'Tipos de Contacto' },
        loadChildren: () =>
          import('./features/contact-types/contact-types.routes').then((m) => m.contactTypesRoutes),
      },
      {
        path: 'applications',
        data: { breadcrumb: 'Aplicaciones' },
        loadChildren: () =>
          import('./features/applications/applications.routes').then((m) => m.applicationsRoutes),
      },
      {
        path: 'service-types',
        data: { breadcrumb: 'Tipos de Servicio' },
        loadChildren: () =>
          import('./features/service-types/service-types.routes').then((m) => m.serviceTypesRoutes),
      },
      {
        path: 'notice-types',
        data: { breadcrumb: 'Tipos de Aviso' },
        loadChildren: () =>
          import('./features/notice-types/notice-types.routes').then((m) => m.noticeTypesRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
