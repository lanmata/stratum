import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { ContactType, ContactTypeRequest } from '@shared/models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactTypeService {
  private readonly http = inject(HttpService);

  getAll(): Observable<ContactType[]> {
    return this.http.get<ContactType[]>(API.CONTACT_TYPES.LIST_ALL);
  }

  getById(id: string): Observable<ContactType> {
    return this.http.get<ContactType>(API.CONTACT_TYPES.BY_ID(id));
  }

  create(req: ContactTypeRequest): Observable<ContactType> {
    return this.http.post<ContactType>(API.CONTACT_TYPES.ROOT, req);
  }

  update(id: string, req: ContactTypeRequest): Observable<ContactType> {
    return this.http.put<ContactType>(API.CONTACT_TYPES.BY_ID(id), req);
  }

  delete(id: string): Observable<ContactType> {
    return this.http.delete<ContactType>(API.CONTACT_TYPES.BY_ID(id));
  }
}
