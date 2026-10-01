import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: 'users', redirectTo: 'applications', pathMatch: 'full' },
  { path: 'roles', redirectTo: 'applications', pathMatch: 'full' },
  {
    path: 'people',
    canActivate: [authGuard],
    loadChildren: () => import('./features/people/people.routes').then((m) => m.peopleRoutes),
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    loadChildren: () => import('./features/audit/audit.routes').then((m) => m.auditRoutes),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'contact-types',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/contact-types/contact-types.routes').then((m) => m.contactTypesRoutes),
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/applications/applications.routes').then((m) => m.applicationsRoutes),
  },
  {
    path: 'service-types',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/service-types/service-types.routes').then((m) => m.serviceTypesRoutes),
  },
  { path: '**', redirectTo: 'dashboard' },
];
