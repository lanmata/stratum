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
    BY_APPLICATION: (applicationId: string) => `/v1/roles/application/${applicationId}`,
    UPDATE: (id: string) => `/v1/roles/${id}`,
  },
  FEATURES: {
    ROOT: '/v1/features',
    WITH_INACTIVE: (include: boolean) => `/v1/features/${include}`,
    BY_ID: (id: string) => `/v1/features/find/${id}`,
    BY_ROLE: (roleId: string) => `/v1/features/role/${roleId}`,
    UPDATE: (id: string) => `/v1/features/${id}`,
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
  APPLICATIONS: {
    ROOT: '/v1/applications',
    BY_ID: (id: string) => `/v1/applications/${id}`,
  },
  SERVICE_TYPES: {
    ROOT: '/v1/service-types',
    LIST_ALL: '/v1/service-types/list-all',
    FIND_BY_ID: (id: string) => `/v1/service-types/find/${id}`,
    BY_ID: (id: string) => `/v1/service-types/${id}`,
  },
  ADDRESSES: {
    ROOT: '/v1/addresses',
    BY_ID: (id: string) => `/v1/addresses/${id}`,
    BY_PERSON: (personId: string) => `/v1/addresses/person/${personId}`,
  },
  IDENTIFICATION_DOCUMENTS: {
    ROOT: '/v1/identification-documents',
    BY_ID: (id: string) => `/v1/identification-documents/${id}`,
    BY_PERSON: (personId: string) => `/v1/identification-documents/person/${personId}`,
  },
  NOTICE_TYPES: {
    ROOT: '/v1/notice-types',
    LIST_ALL: '/v1/notice-types/list-all',
    BY_ID: (id: string) => `/v1/notice-types/${id}`,
  },
  NOTICES: {
    ROOT: '/v1/notices',
    BY_APPLICATION: (applicationId: string) => `/v1/notices/application/${applicationId}`,
    DELETE: (userId: string, applicationId: string, noticeTypeId: string) =>
      `/v1/notices/user/${userId}/application/${applicationId}/notice-type/${noticeTypeId}`,
  },
  MANAGED_CLIENTS: {
    ROOT: '/v1/managed-clients',
    BY_ID: (clientId: string) => `/v1/managed-clients/${clientId}`,
    ROTATE_SECRET: (clientId: string) => `/v1/managed-clients/${clientId}/rotate-secret`,
    REVOKE_TOKENS: (clientId: string) => `/v1/managed-clients/${clientId}/tokens`,
  },
} as const;

export const SESSION_TOKEN_HEADER = 'session-token';
