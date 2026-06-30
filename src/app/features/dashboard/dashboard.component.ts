import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AsyncPipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="border-b border-gray-200 bg-white px-6 py-4">
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold text-gray-900">Backoffice</span>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">
              {{ (store.user$ | async)?.displayName }}
            </span>
            <button
              (click)="auth.logout()"
              class="text-sm text-red-600 hover:text-red-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main class="mx-auto max-w-5xl px-6 py-10">
        <h2 class="mb-8 text-xl font-semibold text-gray-800">Administration</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              class="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow"
            >
              <span class="text-2xl">{{ item.icon }}</span>
              <span class="font-medium text-gray-800">{{ item.label }}</span>
              <span class="text-xs text-gray-500">{{ item.description }}</span>
            </a>
          }
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly store = inject(SessionStoreService);
  protected readonly auth = inject(AuthService);

  protected readonly navItems = [
    { path: '/users', icon: '👤', label: 'Users', description: 'Manage user accounts' },
    { path: '/roles', icon: '🔑', label: 'Roles', description: 'Define access roles' },
    { path: '/people', icon: '🧑', label: 'People', description: 'Manage person records' },
    { path: '/contacts', icon: '📇', label: 'Contacts', description: 'Contact information' },
    { path: '/features-mgmt', icon: '⚙️', label: 'Features', description: 'Feature flags' },
    { path: '/audit', icon: '📋', label: 'Audit', description: 'Event log' },
  ];
}
