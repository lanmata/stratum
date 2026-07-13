import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApplicationService } from './application.service';
import { Application } from '@shared/models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationDirectoryService {
  private readonly applicationService = inject(ApplicationService);
  private readonly _all = signal<Application[]>([]);
  readonly all = this._all.asReadonly();

  setAll(apps: Application[]): void {
    this._all.set(apps);
  }

  resolve(applicationId: string): Observable<Application | undefined> {
    const cached = this._all().find((a) => a.id === applicationId);
    if (cached) return of(cached);
    return this.applicationService.getAll().pipe(
      tap((list) => this._all.set(list)),
      map((list) => list.find((a) => a.id === applicationId)),
    );
  }
}
