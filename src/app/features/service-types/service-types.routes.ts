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
    data: { breadcrumb: 'Nuevo tipo' },
    loadComponent: () =>
      import('./service-type-form/service-type-form.component').then(
        (m) => m.ServiceTypeFormComponent,
      ),
  },
  {
    path: ':serviceTypeId/edit',
    data: { breadcrumb: 'Editar' },
    loadComponent: () =>
      import('./service-type-form/service-type-form.component').then(
        (m) => m.ServiceTypeFormComponent,
      ),
  },
];
