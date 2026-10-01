import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./roles-list/roles-list.component').then((m) => m.RolesListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./role-form/role-form.component').then((m) => m.RoleFormComponent),
  },
  {
    path: ':roleId/edit',
    loadComponent: () =>
      import('./role-form/role-form.component').then((m) => m.RoleFormComponent),
  },
];
