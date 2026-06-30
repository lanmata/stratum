import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Contact } from '@shared/models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpService);

  create(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(`${API.CONTACTS.ROOT}/`, contact);
  }

  getById(contactId: string): Observable<Contact> {
    return this.http.get<Contact>(API.CONTACTS.BY_ID(contactId));
  }

  getAll(): Observable<Contact[]> {
    return this.http.get<Contact[]>(API.CONTACTS.LIST);
  }

  getByPerson(personId: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(API.CONTACTS.BY_PERSON(personId));
  }

  update(contactId: string, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(API.CONTACTS.BY_ID(contactId), contact);
  }

  delete(contactId: string): Observable<string> {
    return this.http.delete<string>(API.CONTACTS.BY_ID(contactId));
  }
}
