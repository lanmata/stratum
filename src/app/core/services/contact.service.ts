import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Contact, ContactSearchParams, ContactWriteRequest } from '@shared/models/contact.model';
import { Page } from '@shared/models/page.model';

function toWriteRequest(contact: Contact): ContactWriteRequest {
  return {
    id: contact.id,
    content: contact.content,
    contentTypeId: contact.contactType.id,
    personId: contact.personId,
    applicationId: contact.applicationId,
    ownerType: contact.ownerType,
    ownerId: contact.ownerId,
    active: contact.active,
  };
}

/**
 * Contacts belong to one subject (a person, or an external owner such as a merchant) inside an
 * application, and are never listed across applications: every read is scoped to a person, an
 * owner or — server-side paginated — an application.
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpService);

  create(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(`${API.CONTACTS.ROOT}/`, toWriteRequest(contact));
  }

  getById(contactId: string): Observable<Contact> {
    return this.http.get<Contact>(API.CONTACTS.BY_ID(contactId));
  }

  search(params: ContactSearchParams): Observable<Page<Contact>> {
    return this.http.get<Page<Contact>>(API.CONTACTS.SEARCH, {
      applicationId: params.applicationId,
      contactTypeId: params.contactTypeId || undefined,
      active: params.active,
      q: params.q?.trim() || undefined,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
  }

  getByPerson(personId: string, applicationId?: string): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.BY_PERSON(personId), { applicationId });
  }

  getByOwner(ownerType: string, ownerId: string, applicationId?: string): Observable<Contact[]> {
    return this.http.getList<Contact>(API.CONTACTS.BY_OWNER(ownerType, ownerId), { applicationId });
  }

  update(contactId: string, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(API.CONTACTS.BY_ID(contactId), toWriteRequest(contact));
  }

  delete(contactId: string): Observable<string> {
    return this.http.delete<string>(API.CONTACTS.BY_ID(contactId));
  }
}
