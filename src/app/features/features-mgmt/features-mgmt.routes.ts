import { Routes } from '@angular/router';

export const featuresMgmtRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features-list/features-list.component').then((m) => m.FeaturesListComponent),
  },
];
