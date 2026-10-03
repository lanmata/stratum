import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Notice, NoticeRequest } from '@shared/models/notice.model';

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly http = inject(HttpService);

  getByApplication(applicationId: string): Observable<Notice[]> {
    return this.http.getList<Notice>(API.NOTICES.BY_APPLICATION(applicationId));
  }

  create(req: NoticeRequest): Observable<Notice> {
    return this.http.post<Notice>(API.NOTICES.ROOT, req);
  }

  delete(userId: string, applicationId: string, noticeTypeId: string): Observable<void> {
    return this.http.delete<void>(API.NOTICES.DELETE(userId, applicationId, noticeTypeId));
  }
}
