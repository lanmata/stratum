import { Injectable, signal } from '@angular/core';
import { Application } from '@shared/models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationEditState {
  readonly current = signal<Application | null>(null);
}
