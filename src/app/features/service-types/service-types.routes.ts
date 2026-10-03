import { Routes } from '@angular/router';

export const serviceTypesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./service-types-list/service-types-list.component').then(
        (m) => m.ServiceTypesListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./service-type-form/service-type-form.component').then(
        (m) => m.ServiceTypeFormComponent,
      ),
  },
  {
    path: ':serviceTypeId/edit',
    loadComponent: () =>
      import('./service-type-form/service-type-form.component').then(
        (m) => m.ServiceTypeFormComponent,
      ),
  },
];
