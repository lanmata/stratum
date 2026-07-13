import { Routes } from '@angular/router';

export const addressesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./addresses-list/addresses-list.component').then((m) => m.AddressesListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./address-form/address-form.component').then((m) => m.AddressFormComponent),
  },
  {
    path: ':addressId/edit',
    loadComponent: () =>
      import('./address-form/address-form.component').then((m) => m.AddressFormComponent),
  },
];
