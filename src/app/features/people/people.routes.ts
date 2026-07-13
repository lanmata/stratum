import { Routes } from '@angular/router';

export const peopleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./people-list/people-list.component').then((m) => m.PeopleListComponent),
  },
  {
    path: ':personId/addresses',
    loadChildren: () => import('../addresses/addresses.routes').then((m) => m.addressesRoutes),
  },
];
