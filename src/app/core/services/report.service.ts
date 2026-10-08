import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { TemplateDocumentModel } from '@shared/models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpService);

  generate(template: File, values: Record<string, string>): Observable<Blob> {
    const form = new FormData();
    form.append('documentTemplate', template, template.name);
    form.append('values', JSON.stringify(values));
    return this.http.postFormForBlob(API.REPORT.TEMPLATE, form);
  }

  placeholders(template: File, model: TemplateDocumentModel = {}): Observable<string[]> {
    const form = new FormData();
    form.append('documentTemplate', template, template.name);
    form.append('templateDocumentModel', JSON.stringify(model));
    return this.http.postForm<string[]>(API.REPORT.PLACEHOLDER_VALUES, form).pipe(
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of([]) : throwError(() => err)))
    );
  }
}
