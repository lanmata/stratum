export const AUDIT_EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'PASSWORD_CHANGE',
  'ROLE_ASSIGNED',
  'ROLE_REVOKED',
  'LOGOUT',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'TOKEN_REFRESH',
  'PASSWORD_RESET_REQUEST',
  'CLIENT_REGISTERED',
  'CLIENT_UPDATED',
  'CLIENT_DEACTIVATED',
  'CLIENT_DELETED',
  'CLIENT_SECRET_ROTATED',
  'CLIENT_TOKEN_ISSUED',
  'CLIENT_TOKEN_ISSUE_FAILED',
  'CLIENT_TOKEN_REVOKED',
  'CLIENT_INTROSPECTION_CALLED',
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export interface AuditEvent {
  id: string;
  userId?: string;
  applicationId?: string | null;
  eventType: AuditEventType | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  occurredAt?: string;
  createdAt?: string;
  details?: string | null;
}

export interface AuditQuery {
  userId?: string;
  applicationId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}
