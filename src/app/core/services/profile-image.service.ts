import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { ProfileImageRef } from '@shared/models/profile-image.model';

@Injectable({ providedIn: 'root' })
export class ProfileImageService {
  private readonly http = inject(HttpService);

  upload(applicationId: string, image: File): Observable<ProfileImageRef> {
    const form = new FormData();
    form.append('image', image, image.name);
    return this.http.postForm<ProfileImageRef>(API.PROFILE_IMAGE.UPLOAD(applicationId), form);
  }

  getImage(): Observable<Blob> {
    return this.http.getBlob(API.PROFILE_IMAGE.ROOT, true);
  }

  getReference(applicationId: string): Observable<ProfileImageRef> {
    return this.http.get<ProfileImageRef>(API.PROFILE_IMAGE.REFERENCE(applicationId));
  }
}
