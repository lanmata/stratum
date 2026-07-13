import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { NoticeType, NoticeTypeRequest } from '@shared/models/notice-type.model';

@Injectable({ providedIn: 'root' })
export class NoticeTypeService {
  private readonly http = inject(HttpService);

  getAll(): Observable<NoticeType[]> {
    return this.http.get<NoticeType[]>(API.NOTICE_TYPES.LIST_ALL);
  }

  getById(id: string): Observable<NoticeType> {
    return this.http.get<NoticeType>(API.NOTICE_TYPES.BY_ID(id));
  }

  create(req: NoticeTypeRequest): Observable<NoticeType> {
    return this.http.post<NoticeType>(API.NOTICE_TYPES.ROOT, req);
  }

  update(id: string, req: NoticeTypeRequest): Observable<NoticeType> {
    return this.http.put<NoticeType>(API.NOTICE_TYPES.BY_ID(id), req);
  }

  delete(id: string): Observable<NoticeType> {
    return this.http.delete<NoticeType>(API.NOTICE_TYPES.BY_ID(id));
  }
}
