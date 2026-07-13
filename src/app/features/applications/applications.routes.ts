import { Routes } from '@angular/router';

export const applicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./applications-list/applications-list.component').then(
        (m) => m.ApplicationsListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
  {
    path: ':applicationId/edit',
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
];
