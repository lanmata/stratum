import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list/users-list.component').then((m) => m.UsersListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./user-form/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: ':userId/edit',
    loadComponent: () => import('./user-form/user-form.component').then((m) => m.UserFormComponent),
  },
];
