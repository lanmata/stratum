import { of } from 'rxjs';
import { HttpService } from './http.service';
import { ContactService } from './contact.service';
import { AddressService } from './address.service';
import { IdentificationDocumentService } from './identification-document.service';
import { TestBed } from '@angular/core/testing';
import { API } from '@shared/constants/api.constants';
import { Contact } from '@shared/models/contact.model';

describe('person-scoped services', () => {
  let http: jasmine.SpyObj<HttpService>;

  beforeEach(() => {
    http = jasmine.createSpyObj<HttpService>('HttpService', [
      'get',
      'getList',
      'post',
      'put',
      'delete',
    ]);
    [http.get, http.getList, http.post, http.put, http.delete].forEach((s) =>
      s.and.returnValue(of({}) as never),
    );
    TestBed.configureTestingModule({ providers: [{ provide: HttpService, useValue: http }] });
  });

  describe('ContactService', () => {
    const contact: Contact = {
      content: 'a@b.com',
      contactType: { id: 't1', name: 'Email', active: true },
      personId: 'p1',
      active: true,
    };
    const wireContact = {
      id: undefined,
      content: 'a@b.com',
      contentTypeId: 't1',
      personId: 'p1',
      active: true,
    };

    it('creates, reads, updates and deletes through HttpService', () => {
      const svc = TestBed.inject(ContactService);
      svc.create(contact).subscribe();
      expect(http.post).toHaveBeenCalledWith(`${API.CONTACTS.ROOT}/`, wireContact);
      svc.getById('c1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.CONTACTS.BY_ID('c1'));
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.CONTACTS.LIST);
      svc.getByPerson('p1').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.CONTACTS.BY_PERSON('p1'));
      svc.update('c1', contact).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.CONTACTS.BY_ID('c1'), wireContact);
      svc.delete('c1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.CONTACTS.BY_ID('c1'));
    });
  });

  describe('AddressService', () => {
    it('creates, reads, updates and deletes through HttpService', () => {
      const svc = TestBed.inject(AddressService);
      const req = { address: { personId: 'p1', content: 'Calle 1' } };
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.ADDRESSES.ROOT, req);
      svc.getById('a1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.ADDRESSES.BY_ID('a1'));
      svc.getByPerson('p1').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ADDRESSES.BY_PERSON('p1'));
      svc.update('a1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.ADDRESSES.BY_ID('a1'), req);
      svc.delete('a1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.ADDRESSES.BY_ID('a1'));
    });
  });

  describe('IdentificationDocumentService', () => {
    it('creates, reads, updates and deletes through HttpService', () => {
      const svc = TestBed.inject(IdentificationDocumentService);
      const req = {
        identificationDocument: { number: 'V1', identificationType: 1, personId: 'p1' },
      };
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.IDENTIFICATION_DOCUMENTS.ROOT, req);
      svc.getById('d1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.IDENTIFICATION_DOCUMENTS.BY_ID('d1'));
      svc.getByPerson('p1').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.IDENTIFICATION_DOCUMENTS.BY_PERSON('p1'));
      svc.update('d1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.IDENTIFICATION_DOCUMENTS.BY_ID('d1'), req);
      svc.delete('d1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.IDENTIFICATION_DOCUMENTS.BY_ID('d1'));
    });
  });
});
