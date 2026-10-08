import { TestBed } from '@angular/core/testing';
import { API } from '@shared/constants/api.constants';
import { createHttpSpy, HttpSpy, provideHttpSpy } from '@app/testing/http-spy';
import { ApplicationService } from './application.service';
import { AuditService } from './audit.service';
import { ContactService } from './contact.service';
import { ContactTypeService } from './contact-type.service';
import { FeatureService } from './feature.service';
import { IamService } from './iam.service';
import { ManagedClientService } from './managed-client.service';
import { NoticeService } from './notice.service';
import { NoticeTypeService } from './notice-type.service';
import { PersonService } from './person.service';
import { ProfileImageService } from './profile-image.service';
import { ReportService } from './report.service';
import { RoleService } from './role.service';
import { ServiceTypeService } from './service-type.service';
import { UserService } from './user.service';
import { of, throwError } from 'rxjs';

describe('feature services', () => {
  let http: HttpSpy;

  beforeEach(() => {
    http = createHttpSpy();
    TestBed.configureTestingModule({ providers: [provideHttpSpy(http)] });
  });

  describe('ApplicationService', () => {
    it('maps every operation to the applications endpoints', () => {
      const svc = TestBed.inject(ApplicationService);
      const req = { application: { name: 'a' } } as never;
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.APPLICATIONS.ROOT);
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.APPLICATIONS.BY_ID('1'));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.APPLICATIONS.ROOT, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.APPLICATIONS.BY_ID('1'), req);
      svc.delete('1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.APPLICATIONS.BY_ID('1'));
    });

    it('filters by ids with a comma separated query param', () => {
      const svc = TestBed.inject(ApplicationService);
      svc.getByIds(['a', 'b']).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.APPLICATIONS.ROOT, { ids: 'a,b' });
    });

    it('does not call the API when no ids are given', () => {
      let result: unknown;
      TestBed.inject(ApplicationService).getByIds([]).subscribe((r) => (result = r));
      expect(http.getList).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('AuditService', () => {
    it('queries events and export with the filters', () => {
      const svc = TestBed.inject(AuditService);
      svc.getEvents({ page: 1, size: 5, eventType: 'LOGOUT' }).subscribe();
      expect(http.get).toHaveBeenCalledWith(API.AUDIT.EVENTS, { page: 1, size: 5, eventType: 'LOGOUT' });
      svc.getEvents().subscribe();
      expect(http.get).toHaveBeenCalledWith(API.AUDIT.EVENTS, {});
      svc.exportEvents({ userId: 'u' }).subscribe();
      expect(http.get).toHaveBeenCalledWith(API.AUDIT.EXPORT, { userId: 'u' });
    });
  });

  describe('ContactService', () => {
    it('resolves contacts by ids and lists all as a list', () => {
      const svc = TestBed.inject(ContactService);
      svc.getByIds(['a', 'b']).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.CONTACTS.BY_IDS(['a', 'b']));
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.CONTACTS.LIST);
    });

    it('short-circuits an empty id list', () => {
      let result: unknown;
      TestBed.inject(ContactService).getByIds([]).subscribe((r) => (result = r));
      expect(result).toEqual([]);
      expect(http.getList).not.toHaveBeenCalled();
    });
  });

  describe('ContactTypeService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(ContactTypeService);
      const req = { contactType: { id: '1', name: 'n', active: true } };
      svc.getAll().subscribe();
      expect(http.get).toHaveBeenCalledWith(API.CONTACT_TYPES.LIST_ALL);
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.CONTACT_TYPES.BY_ID('1'));
      svc.getByIds(['1', '2']).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.CONTACT_TYPES.BY_IDS(['1', '2']));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.CONTACT_TYPES.ROOT, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.CONTACT_TYPES.BY_ID('1'), req);
      svc.delete('1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.CONTACT_TYPES.BY_ID('1'));
    });

    it('short-circuits an empty id list', () => {
      let result: unknown;
      TestBed.inject(ContactTypeService).getByIds([]).subscribe((r) => (result = r));
      expect(result).toEqual([]);
    });
  });

  describe('FeatureService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(FeatureService);
      const req = { feature: { name: 'f', active: true } };
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.FEATURES.WITH_INACTIVE(false));
      svc.getAll(true).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.FEATURES.WITH_INACTIVE(true));
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.FEATURES.BY_ID('1'));
      svc.getByRole('r').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.FEATURES.BY_ROLE('r'));
      svc.getByStatusAndIds(true, ['a']).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.FEATURES.BY_STATUS_AND_IDS(true, ['a']));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.FEATURES.ROOT, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.FEATURES.UPDATE('1'), req);
    });

    it('short-circuits an empty id list', () => {
      let result: unknown;
      TestBed.inject(FeatureService).getByStatusAndIds(true, []).subscribe((r) => (result = r));
      expect(result).toEqual([]);
    });
  });

  describe('IamService', () => {
    it('introspects tokens and checks permissions', () => {
      const svc = TestBed.inject(IamService);
      svc.introspectToken('tok').subscribe();
      expect(http.post).toHaveBeenCalledWith(API.IAM.INTROSPECT, { token: 'tok' });
      const req = { permission: 'ROLE_X', sessionToken: 't' };
      svc.checkPermission(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.IAM.PERMISSION_CHECK, req);
    });
  });

  describe('ManagedClientService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(ManagedClientService);
      svc.list().subscribe();
      expect(http.get).toHaveBeenCalledWith(API.MANAGED_CLIENTS.ROOT);
      svc.list('app').subscribe();
      expect(http.get).toHaveBeenCalledWith(`${API.MANAGED_CLIENTS.ROOT}?applicationId=app`);
      svc.getById('c').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.MANAGED_CLIENTS.BY_ID('c'));
      const create = { name: 'n', applicationId: 'a', scopes: ['s'] };
      svc.create(create).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.MANAGED_CLIENTS.ROOT, create);
      svc.update('c', { active: false }).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.MANAGED_CLIENTS.BY_ID('c'), { active: false });
      svc.delete('c').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.MANAGED_CLIENTS.BY_ID('c'));
      svc.rotateSecret('c').subscribe();
      expect(http.post).toHaveBeenCalledWith(API.MANAGED_CLIENTS.ROTATE_SECRET('c'), {});
      svc.revokeAllTokens('c').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.MANAGED_CLIENTS.REVOKE_TOKENS('c'));
    });

    it('issues and introspects M2M tokens', () => {
      const svc = TestBed.inject(ManagedClientService);
      const req = { clientId: 'c', clientSecret: 's', scopes: ['a'] };
      svc.issueToken(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.MANAGED_CLIENTS.TOKEN, req);
      svc.introspectToken('tok').subscribe();
      expect(http.post).toHaveBeenCalledWith(API.MANAGED_CLIENTS.INTROSPECT, { token: 'tok' });
    });
  });

  describe('NoticeService and NoticeTypeService', () => {
    it('maps every operation', () => {
      const notices = TestBed.inject(NoticeService);
      notices.getByApplication('a').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.NOTICES.BY_APPLICATION('a'));
      const req = { notice: { userId: 'u', applicationId: 'a', noticeTypeId: 'n' } };
      notices.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.NOTICES.ROOT, req);
      notices.delete('u', 'a', 'n').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.NOTICES.DELETE('u', 'a', 'n'));

      const types = TestBed.inject(NoticeTypeService);
      const typeReq = { noticeType: { id: '1', name: 'n', active: true } } as never;
      types.getAll().subscribe();
      expect(http.get).toHaveBeenCalledWith(API.NOTICE_TYPES.LIST_ALL);
      types.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.NOTICE_TYPES.BY_ID('1'));
      types.create(typeReq).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.NOTICE_TYPES.ROOT, typeReq);
      types.update('1', typeReq).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.NOTICE_TYPES.BY_ID('1'), typeReq);
      types.delete('1').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.NOTICE_TYPES.BY_ID('1'));
    });
  });

  describe('PersonService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(PersonService);
      const req = { person: { firstName: 'a', lastName: 'b' } };
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.PEOPLE.ROOT);
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.PEOPLE.BY_ID('1'));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(`${API.PEOPLE.ROOT}/`, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.PEOPLE.BY_ID('1'), req);
    });
  });

  describe('ProfileImageService', () => {
    it('uploads the image as multipart form data', () => {
      const svc = TestBed.inject(ProfileImageService);
      const file = new File(['x'], 'logo.png', { type: 'image/png' });
      svc.upload('app', file).subscribe();
      const [path, form] = http.postForm.calls.mostRecent().args;
      expect(path).toBe(API.PROFILE_IMAGE.UPLOAD('app'));
      expect((form as FormData).get('image')).toEqual(jasmine.any(File));
      expect(((form as FormData).get('image') as File).name).toBe('logo.png');
    });

    it('fetches the current image silently and the application reference', () => {
      const svc = TestBed.inject(ProfileImageService);
      svc.getImage().subscribe();
      expect(http.getBlob).toHaveBeenCalledWith(API.PROFILE_IMAGE.ROOT, true);
      svc.getReference('app').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.PROFILE_IMAGE.REFERENCE('app'));
    });
  });

  describe('ReportService', () => {
    const template = new File(['d'], 'plantilla.docx');

    it('generates a document with the template and the JSON values', () => {
      TestBed.inject(ReportService).generate(template, { name: 'Ana' }).subscribe();
      const [path, form] = http.postFormForBlob.calls.mostRecent().args;
      expect(path).toBe(API.REPORT.TEMPLATE);
      expect((form as FormData).get('values')).toBe('{"name":"Ana"}');
      expect(((form as FormData).get('documentTemplate') as File).name).toBe('plantilla.docx');
    });

    it('requests placeholders with the model', () => {
      http.postForm.and.returnValue(of(['a', 'b']) as never);
      let result: unknown;
      TestBed.inject(ReportService).placeholders(template, { templateName: 't' }).subscribe((r) => (result = r));
      const [path, form] = http.postForm.calls.mostRecent().args;
      expect(path).toBe(API.REPORT.PLACEHOLDER_VALUES);
      expect((form as FormData).get('templateDocumentModel')).toBe('{"templateName":"t"}');
      expect(result).toEqual(['a', 'b']);
    });

    it('defaults the model and treats 404 as no placeholders', () => {
      http.postForm.and.returnValue(throwError(() => ({ status: 404 })) as never);
      let result: unknown;
      TestBed.inject(ReportService).placeholders(template).subscribe((r) => (result = r));
      expect(result).toEqual([]);
      expect(((http.postForm.calls.mostRecent().args[1]) as FormData).get('templateDocumentModel')).toBe('{}');
    });

    it('rethrows other errors', () => {
      http.postForm.and.returnValue(throwError(() => ({ status: 500 })) as never);
      let error: unknown;
      TestBed.inject(ReportService).placeholders(template).subscribe({ error: (e) => (error = e) });
      expect(error).toEqual({ status: 500 });
    });
  });

  describe('RoleService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(RoleService);
      const req = { role: { name: 'r', applicationId: 'a', active: true } };
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ROLES.ROOT);
      svc.getByStatus(false).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ROLES.WITH_INACTIVE(false));
      svc.getByStatusAndIds(true, ['a', 'b']).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ROLES.BY_STATUS_AND_IDS(true, ['a', 'b']));
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.ROLES.BY_ID('1'));
      svc.getByUser('u').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ROLES.BY_USER('u'));
      svc.getByApplication('a').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.ROLES.BY_APPLICATION('a'));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(`${API.ROLES.ROOT}/`, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.ROLES.UPDATE('1'), req);
    });

    it('short-circuits an empty id list', () => {
      let result: unknown;
      TestBed.inject(RoleService).getByStatusAndIds(true, []).subscribe((r) => (result = r));
      expect(result).toEqual([]);
      expect(http.getList).not.toHaveBeenCalled();
    });
  });

  describe('ServiceTypeService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(ServiceTypeService);
      const req = { serviceType: { id: '1', name: 'n', active: true } };
      svc.getAll().subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.SERVICE_TYPES.LIST_ALL);
      svc.getByStatus(true).subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.SERVICE_TYPES.BY_STATUS(true));
      svc.getById('1').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.SERVICE_TYPES.FIND_BY_ID('1'));
      svc.create(req).subscribe();
      expect(http.post).toHaveBeenCalledWith(API.SERVICE_TYPES.ROOT, req);
      svc.update('1', req).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.SERVICE_TYPES.BY_ID('1'), req);
    });
  });

  describe('UserService', () => {
    it('maps every operation', () => {
      const svc = TestBed.inject(UserService);
      svc.create({} as never).subscribe();
      expect(http.postWithResponse).toHaveBeenCalledWith(API.USERS.ROOT, {});
      svc.getById('u').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.USERS.BY_ID('u'));
      svc.getByApplication('a').subscribe();
      expect(http.getList).toHaveBeenCalledWith(API.USERS.BY_APPLICATION('a'));
      svc.getByAlias('al', 'a').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.USERS.BY_ALIAS('al', 'a'));
      svc.findAliasRecord('al', 'a').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.USERS.ALIAS_RECORD('al', 'a'));
      svc.checkAlias('al', 'a').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.USERS.CHECK_ALIAS('al', 'a'));
      svc.checkEmail('e@x.com', 'a').subscribe();
      expect(http.get).toHaveBeenCalledWith(API.USERS.CHECK_EMAIL('e@x.com', 'a'));
      svc.updateFull('u', { id: 'u' } as never).subscribe();
      expect(http.put).toHaveBeenCalledWith(API.USERS.FULL_DETAIL('u'), { id: 'u' });
      svc.update('u', { userId: 'u' }).subscribe();
      expect(http.put).toHaveBeenCalledWith(`${API.USERS.ROOT}/u`, { userId: 'u' });
      svc.linkRole('u', 'r').subscribe();
      expect(http.put).toHaveBeenCalledWith(API.USERS.LINK_ROLE('u', 'r'), {});
      svc.unlinkRole('u', 'r').subscribe();
      expect(http.put).toHaveBeenCalledWith(API.USERS.UNLINK_ROLE('u', 'r'), {});
      svc.delete('a', 'u').subscribe();
      expect(http.delete).toHaveBeenCalledWith(API.USERS.DELETE('a', 'u'));
    });
  });
});
