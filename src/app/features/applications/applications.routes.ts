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
    data: { breadcrumb: 'Nueva aplicación' },
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
  {
    path: ':applicationId/edit',
    data: { breadcrumb: 'Editar' },
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
  {
    path: ':applicationId',
    data: { breadcrumb: 'Aplicación', breadcrumbKey: 'applicationId' },
    loadComponent: () =>
      import('./application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        data: { breadcrumb: 'Usuarios' },
        loadChildren: () => import('../users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'roles',
        data: { breadcrumb: 'Roles' },
        loadChildren: () => import('../roles/roles.routes').then((m) => m.rolesRoutes),
      },
      {
        path: 'managed-clients',
        data: { breadcrumb: 'Clientes M2M' },
        loadComponent: () =>
          import('./application-managed-clients/application-managed-clients.component').then(
            (m) => m.ApplicationManagedClientsComponent,
          ),
      },
      {
        path: 'notices',
        data: { breadcrumb: 'Avisos' },
        loadComponent: () =>
          import('./application-notices/application-notices.component').then(
            (m) => m.ApplicationNoticesComponent,
          ),
      },
    ],
  },
];
