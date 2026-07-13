import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AsyncPipe],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">Backoffice</span>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ (store.user$ | async)?.displayName }}
            </span>
            <button
              (click)="theme.toggle()"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (theme.isDark()) {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"/>
                </svg>
              } @else {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              }
            </button>
            <button
              (click)="auth.logout()"
              class="text-sm text-red-600 hover:text-red-800 dark:hover:text-red-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main class="mx-auto max-w-5xl px-6 py-10">
        <h2 class="mb-8 text-xl font-semibold text-gray-800 dark:text-gray-200">Administration</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              class="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <span class="text-2xl">{{ item.icon }}</span>
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ item.label }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</span>
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
  protected readonly theme = inject(ThemeService);

  protected readonly navItems = [
    { path: '/applications', icon: '🏢', label: 'Aplicaciones', description: 'Gestionar aplicaciones, sus usuarios y roles' },
    { path: '/roles', icon: '🔑', label: 'Roles', description: 'Define access roles' },
    { path: '/people', icon: '🧑', label: 'People', description: 'Manage person records' },
    { path: '/contacts', icon: '📇', label: 'Contacts', description: 'Contact information' },
    { path: '/features-mgmt', icon: '⚙️', label: 'Features', description: 'Feature flags' },
    { path: '/audit', icon: '📋', label: 'Audit', description: 'Event log' },
    { path: '/contact-types', icon: '🏷️', label: 'Tipos de Contacto', description: 'Catálogo de tipos de contacto' },
    { path: '/service-types', icon: '🔧', label: 'Tipos de Servicio', description: 'Catálogo de tipos de servicio' },
    { path: '/identification-documents', icon: '🪪', label: 'Tipos de Documento', description: 'Catálogo de tipos de documento de identificación' },
    { path: '/notice-types', icon: '🔔', label: 'Tipos de Aviso', description: 'Catálogo de tipos de aviso' },
  ];
}
