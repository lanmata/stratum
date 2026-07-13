import { Routes } from '@angular/router';

export const noticeTypesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notice-types-list/notice-types-list.component').then(
        (m) => m.NoticeTypesListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./notice-type-form/notice-type-form.component').then(
        (m) => m.NoticeTypeFormComponent
      ),
  },
  {
    path: ':noticeTypeId/edit',
    loadComponent: () =>
      import('./notice-type-form/notice-type-form.component').then(
        (m) => m.NoticeTypeFormComponent
      ),
  },
];
