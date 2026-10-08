import { Routes } from '@angular/router';

export const iamRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./iam-tools.component').then((m) => m.IamToolsComponent),
  },
];
