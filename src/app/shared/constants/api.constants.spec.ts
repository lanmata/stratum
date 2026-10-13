import { AUDIT_EVENT_TYPES } from '@shared/models/audit.model';
import { API, SESSION_TOKEN_HEADER } from './api.constants';

describe('API constants', () => {
  it('builds user paths', () => {
    expect(API.USERS.BY_ID('u')).toBe('/v1/users/user/u');
    expect(API.USERS.BY_APPLICATION('a')).toBe('/v1/users/application/a');
    expect(API.USERS.CHECK_ALIAS('al', 'a')).toBe('/v1/users/check/alias/al/application/a');
    expect(API.USERS.CHECK_EMAIL('e', 'a')).toBe('/v1/users/check/email/e/application/a');
    expect(API.USERS.BY_ALIAS('al', 'a')).toBe('/v1/users/userByAlias/al/application/a');
    expect(API.USERS.ALIAS_RECORD('al', 'a')).toBe('/v1/users/alias/al/application/a');
    expect(API.USERS.FULL_DETAIL('u')).toBe('/v1/users/u/full-detail');
    expect(API.USERS.LINK_ROLE('u', 'r')).toBe('/v1/users/link/user/u/role/r');
    expect(API.USERS.UNLINK_ROLE('u', 'r')).toBe('/v1/users/unlink/user/u/role/r');
    expect(API.USERS.DELETE('a', 'u')).toBe('/v1/users/application/a/user/u');
  });

  it('builds role and feature paths, including id lists', () => {
    expect(API.ROLES.WITH_INACTIVE(true)).toBe('/v1/roles/true');
    expect(API.ROLES.BY_ID('r')).toBe('/v1/roles/find/r');
    expect(API.ROLES.BY_USER('u')).toBe('/v1/roles/user/u');
    expect(API.ROLES.BY_APPLICATION('a')).toBe('/v1/roles/application/a');
    expect(API.ROLES.BY_STATUS_AND_IDS(false, ['a', 'b'])).toBe('/v1/roles/false/a,b');
    expect(API.ROLES.UPDATE('r')).toBe('/v1/roles/r');
    expect(API.FEATURES.WITH_INACTIVE(false)).toBe('/v1/features/false');
    expect(API.FEATURES.BY_ID('f')).toBe('/v1/features/find/f');
    expect(API.FEATURES.BY_ROLE('r')).toBe('/v1/features/role/r');
    expect(API.FEATURES.BY_STATUS_AND_IDS(true, ['x'])).toBe('/v1/features/true/x');
    expect(API.FEATURES.UPDATE('f')).toBe('/v1/features/f');
  });

  it('builds contact, people and catalogue paths', () => {
    expect(API.CONTACTS.BY_ID('c')).toBe('/v1/contacts/c');
    expect(API.CONTACTS.BY_PERSON('p')).toBe('/v1/contacts/person/p');
    expect(API.CONTACTS.BY_IDS(['a', 'b'])).toBe('/v1/contacts/list/a,b');
    expect(API.PEOPLE.BY_ID('p')).toBe('/v1/people/p');
    expect(API.CONTACT_TYPES.BY_ID('t')).toBe('/v1/contact-types/t');
    expect(API.CONTACT_TYPES.BY_IDS(['a'])).toBe('/v1/contact-types/list/a');
    expect(API.APPLICATIONS.BY_ID('a')).toBe('/v1/applications/a');
    expect(API.SERVICE_TYPES.FIND_BY_ID('s')).toBe('/v1/service-types/find/s');
    expect(API.SERVICE_TYPES.BY_ID('s')).toBe('/v1/service-types/s');
    expect(API.SERVICE_TYPES.BY_STATUS(false)).toBe('/v1/service-types/false');
    expect(API.ADDRESSES.BY_ID('a')).toBe('/v1/addresses/a');
    expect(API.ADDRESSES.BY_PERSON('p')).toBe('/v1/addresses/person/p');
    expect(API.IDENTIFICATION_DOCUMENTS.BY_ID('d')).toBe('/v1/identification-documents/d');
    expect(API.IDENTIFICATION_DOCUMENTS.BY_PERSON('p')).toBe('/v1/identification-documents/person/p');
    expect(API.NOTICE_TYPES.BY_ID('n')).toBe('/v1/notice-types/n');
    expect(API.NOTICES.BY_APPLICATION('a')).toBe('/v1/notices/application/a');
    expect(API.NOTICES.DELETE('u', 'a', 'n')).toBe('/v1/notices/user/u/application/a/notice-type/n');
  });

  it('builds managed client, IAM, profile image and report paths', () => {
    expect(API.MANAGED_CLIENTS.BY_ID('c')).toBe('/v1/managed-clients/c');
    expect(API.MANAGED_CLIENTS.ROTATE_SECRET('c')).toBe('/v1/managed-clients/c/rotate-secret');
    expect(API.MANAGED_CLIENTS.REVOKE_TOKENS('c')).toBe('/v1/managed-clients/c/tokens');
    expect(API.MANAGED_CLIENTS.TOKEN).toBe('/v1/managed-clients/token');
    expect(API.MANAGED_CLIENTS.INTROSPECT).toBe('/v1/managed-clients/introspect');
    expect(API.IAM.INTROSPECT).toBe('/v1/iam/tokens/introspect');
    expect(API.IAM.PERMISSION_CHECK).toBe('/v1/iam/permissions/check');
    expect(API.PROFILE_IMAGE.ROOT).toBe('/v1/profile/image/');
    expect(API.PROFILE_IMAGE.UPLOAD('a')).toBe('/v1/profile/image/application/a');
    expect(API.PROFILE_IMAGE.REFERENCE('a')).toBe('/v1/profile/image/application/a/reference');
    expect(API.REPORT.TEMPLATE).toBe('/v1/report/template');
    expect(API.REPORT.PLACEHOLDER_VALUES).toBe('/v1/report/placeholdervalues');
  });

  it('exposes the session header and the audit event types', () => {
    expect(SESSION_TOKEN_HEADER).toBe('session-token');
    expect(AUDIT_EVENT_TYPES).toContain('LOGIN_SUCCESS');
    expect(AUDIT_EVENT_TYPES.length).toBe(19);
  });
});
