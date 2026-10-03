import { Routes } from '@angular/router';

export const peopleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./people-list/people-list.component').then((m) => m.PeopleListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./person-form/person-form.component').then((m) => m.PersonFormComponent),
  },
  {
    path: ':personId/edit',
    loadComponent: () =>
      import('./person-form/person-form.component').then((m) => m.PersonFormComponent),
  },
];
