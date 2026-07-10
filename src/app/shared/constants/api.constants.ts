export const API = {
  APPLICATION: {
    ID: '0cfae22b-2c3c-417b-9649-ac9fc3027275'
  },
  SESSION: {
    ROOT: '/v1/session',
    TOKEN: '/v1/session/token',
    VALIDATE: '/v1/session/validate',
    RENEW: '/v1/session/renew',
    REFRESH: '/v1/session/refresh',
  },
  USERS: {
    ROOT: '/v1/users',
    BY_ID: (id: string) => `/v1/users/user/${id}`,
    BY_APPLICATION: (appId: string) => `/v1/users/application/${appId}`,
    CHECK_ALIAS: (alias: string, appId: string) => `/v1/users/check/alias/${alias}/application/${appId}`,
    CHECK_EMAIL: (email: string, appId: string) => `/v1/users/check/email/${email}/application/${appId}`,
    BY_ALIAS: (alias: string, appId: string) => `/v1/users/userByAlias/${alias}/application/${appId}`,
    ALIAS_TO: (alias: string, appId: string) => `/v1/users/alias/${alias}/application/${appId}`,
    FULL_DETAIL: (id: string) => `/v1/users/${id}/full-detail`,
    LINK_ROLE: (userId: string, roleId: string) => `/v1/users/link/user/${userId}/role/${roleId}`,
    UNLINK_ROLE: (userId: string, roleId: string) => `/v1/users/unlink/user/${userId}/role/${roleId}`,
    DELETE: (appId: string, userId: string) => `/v1/users/application/${appId}/user/${userId}`,
  },
  ROLES: {
    ROOT: '/v1/roles',
    WITH_INACTIVE: (include: boolean) => `/v1/roles/${include}`,
    BY_ID: (id: string) => `/v1/roles/find/${id}`,
    BY_USER: (userId: string) => `/v1/roles/user/${userId}`,
    UPDATE: (id: string) => `/v1/roles/${id}`,
  },
  FEATURES: {
    WITH_INACTIVE: (include: boolean) => `/v1/features/${include}`,
    BY_ID: (id: string) => `/v1/features/find/${id}`,
  },
  CONTACTS: {
    ROOT: '/v1/contacts',
    BY_ID: (id: string) => `/v1/contacts/${id}`,
    LIST: '/v1/contacts/list-all',
    BY_PERSON: (personId: string) => `/v1/contacts/person/${personId}`,
  },
  PEOPLE: {
    ROOT: '/v1/people',
    BY_ID: (id: string) => `/v1/people/${id}`,
  },
  AUDIT: {
    EVENTS: '/v1/iam/audit/events',
    EXPORT: '/v1/iam/audit/export',
  },
  CONTACT_TYPES: {
    ROOT: '/v1/contact-types',
    LIST_ALL: '/v1/contact-types/list-all',
    BY_ID: (id: string) => `/v1/contact-types/${id}`,
  },
} as const;

export const SESSION_TOKEN_HEADER = 'session-token';
