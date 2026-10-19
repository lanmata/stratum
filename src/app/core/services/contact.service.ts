import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Contact, ContactSearchParams, ContactWriteRequest } from '@shared/models/contact.model';
import { PageResponse } from '@shared/models/page.model';

function toWriteRequest(contact: Contact): ContactWriteRequest {
  return {
    id: contact.id,
    content: contact.content,
    contentTypeId: contact.contactType.id,
    ...(contact.personId ? { personId: contact.personId } : {}),
    ...(contact.applicationId ? { applicationId: contact.applicationId } : {}),
    ...(contact.ownerType ? { ownerType: contact.ownerType } : {}),
    ...(contact.ownerId ? { ownerId: contact.ownerId } : {}),
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

  /** Server-side paginated directory of one application (`applicationId` is mandatory). */
  search(params: ContactSearchParams): Observable<PageResponse<Contact>> {
    return this.http.get<PageResponse<Contact>>(API.CONTACTS.ROOT, { ...params });
  }

  /** Contacts of an external owner, optionally limited to one application. */
  getByOwner(ownerType: string, ownerId: string, applicationId?: string): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.BY_OWNER(ownerType, ownerId), { applicationId });
  }

  getByIds(contactIds: string[]): Observable<Contact[]> {
    if (contactIds.length === 0) return of([]);
    return this.http.getList<Contact>(API.CONTACTS.BY_IDS(contactIds));
  }

  getByPerson(personId: string, applicationId?: string): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.BY_PERSON(personId), { applicationId });
  }

  update(contactId: string, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(API.CONTACTS.BY_ID(contactId), toWriteRequest(contact));
  }

  delete(contactId: string): Observable<string> {
    return this.http.delete<string>(API.CONTACTS.BY_ID(contactId));
  }
}
