import { Routes } from '@angular/router';

export const featuresMgmtRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features-list/features-list.component').then((m) => m.FeaturesListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./feature-form/feature-form.component').then((m) => m.FeatureFormComponent),
  },
  {
    path: ':featureId/edit',
    loadComponent: () =>
      import('./feature-form/feature-form.component').then((m) => m.FeatureFormComponent),
  },
];
