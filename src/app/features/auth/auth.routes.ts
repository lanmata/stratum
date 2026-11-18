import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'federation/complete',
    loadComponent: () =>
      import('./federation-complete/federation-complete.component').then((m) => m.FederationCompleteComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
];
