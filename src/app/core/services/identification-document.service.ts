import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  IdentificationDocument,
  IdentificationDocumentRequest,
} from '@shared/models/identification-document.model';

@Injectable({ providedIn: 'root' })
export class IdentificationDocumentService {
  private readonly http = inject(HttpService);

  getAll(): Observable<IdentificationDocument[]> {
    return this.http.get<IdentificationDocument[]>(API.IDENTIFICATION_DOCUMENTS.LIST_ALL);
  }

  getById(id: string): Observable<IdentificationDocument> {
    return this.http.get<IdentificationDocument>(API.IDENTIFICATION_DOCUMENTS.BY_ID(id));
  }

  create(req: IdentificationDocumentRequest): Observable<IdentificationDocument> {
    return this.http.post<IdentificationDocument>(API.IDENTIFICATION_DOCUMENTS.ROOT, req);
  }

  update(id: string, req: IdentificationDocumentRequest): Observable<IdentificationDocument> {
    return this.http.put<IdentificationDocument>(API.IDENTIFICATION_DOCUMENTS.BY_ID(id), req);
  }

  delete(id: string): Observable<IdentificationDocument> {
    return this.http.delete<IdentificationDocument>(API.IDENTIFICATION_DOCUMENTS.BY_ID(id));
  }
}
