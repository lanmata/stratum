import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { AuditEvent, AuditQuery } from '@shared/models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpService);

  getEvents(query: AuditQuery = {}): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(API.AUDIT.EVENTS, query as Record<string, string | number | boolean | string[] | undefined>);
  }

  exportEvents(query: Omit<AuditQuery, 'page' | 'size'>): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(API.AUDIT.EXPORT, query as Record<string, string | number | boolean | string[] | undefined>);
  }
}
