import { Routes } from '@angular/router';

export const contactsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contacts-list/contacts-list.component').then((m) => m.ContactsListComponent),
  },
];
