import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  upsert(app: Application): void {
    this._all.update((list) => [...list.filter((a) => a.id !== app.id), app]);
  }

  resolve(applicationId: string): Observable<Application | undefined> {
    const cached = this._all().find((a) => a.id === applicationId);
    if (cached) return of(cached);
    return this.applicationService.getById(applicationId).pipe(
      tap((app) => this._all.update((list) => [...list.filter((a) => a.id !== app.id), app])),
      catchError(() => of(undefined)),
    );
  }
}
