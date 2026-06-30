export interface AuditEvent {
  id: string;
  userId?: string;
  applicationId?: string;
  eventType: string;
  timestamp: string;
  details?: Record<string, unknown>;
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
