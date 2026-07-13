import { Routes } from '@angular/router';

export const identificationDocumentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./identification-documents-list/identification-documents-list.component').then(
        (m) => m.IdentificationDocumentsListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./identification-document-form/identification-document-form.component').then(
        (m) => m.IdentificationDocumentFormComponent
      ),
  },
  {
    path: ':identificationDocumentId/edit',
    loadComponent: () =>
      import('./identification-document-form/identification-document-form.component').then(
        (m) => m.IdentificationDocumentFormComponent
      ),
  },
];
