import { Routes } from '@angular/router';

export const contactTypesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contact-types-list/contact-types-list.component').then(
        (m) => m.ContactTypesListComponent
      ),
  },
  {
    path: 'new',
    data: { breadcrumb: 'Nuevo tipo' },
    loadComponent: () =>
      import('./contact-type-form/contact-type-form.component').then(
        (m) => m.ContactTypeFormComponent
      ),
  },
  {
    path: ':contactTypeId/edit',
    data: { breadcrumb: 'Editar' },
    loadComponent: () =>
      import('./contact-type-form/contact-type-form.component').then(
        (m) => m.ContactTypeFormComponent
      ),
  },
];
