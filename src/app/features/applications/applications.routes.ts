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
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
  {
    path: ':applicationId/edit',
    loadComponent: () =>
      import('./application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent,
      ),
  },
  {
    path: ':applicationId',
    loadComponent: () =>
      import('./application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        loadChildren: () => import('../users/users.routes').then((m) => m.usersRoutes),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./application-roles/application-roles.component').then(
            (m) => m.ApplicationRolesComponent,
          ),
      },
      {
        path: 'notices',
        loadComponent: () =>
          import('./application-notices/application-notices.component').then(
            (m) => m.ApplicationNoticesComponent,
          ),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./application-assignments/application-assignments.component').then(
            (m) => m.ApplicationAssignmentsComponent,
          ),
      },
    ],
  },
];
