import { Routes } from '@angular/router';

export const auditRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./audit-list/audit-list.component').then((m) => m.AuditListComponent),
  },
];
