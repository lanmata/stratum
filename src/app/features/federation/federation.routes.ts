import { Routes } from '@angular/router';

export const federationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./providers-page/providers-page.component').then((m) => m.ProvidersPageComponent),
  },
];
