import { Routes } from '@angular/router';

export const usageRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./usage-reports.component').then((m) => m.UsageReportsComponent),
  },
];
