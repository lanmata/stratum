import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Contact, ContactWriteRequest } from '@shared/models/contact.model';

function toWriteRequest(contact: Contact): ContactWriteRequest {
  return {
    id: contact.id,
    content: contact.content,
    contentTypeId: contact.contactType.id,
    personId: contact.personId,
    active: contact.active,
  };
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpService);

  create(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(`${API.CONTACTS.ROOT}/`, toWriteRequest(contact));
  }

  getById(contactId: string): Observable<Contact> {
    return this.http.get<Contact>(API.CONTACTS.BY_ID(contactId));
  }

  getAll(): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.LIST);
  }

  getByIds(contactIds: string[]): Observable<Contact[]> {
    if (contactIds.length === 0) return of([]);
    return this.http.getList<Contact>(API.CONTACTS.BY_IDS(contactIds));
  }

  getByPerson(personId: string): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.BY_PERSON(personId));
  }

  update(contactId: string, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(API.CONTACTS.BY_ID(contactId), toWriteRequest(contact));
  }

  delete(contactId: string): Observable<string> {
    return this.http.delete<string>(API.CONTACTS.BY_ID(contactId));
  }
}
