import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports.component').then((m) => m.ReportsComponent),
  },
];
