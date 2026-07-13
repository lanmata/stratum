import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '@core/services/application.service';
import { ApplicationEditState } from '@core/services/application-edit.state';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '@env/environment';

type StatusFilter = 'all' | 'active' | 'inactive';

function formatLocalDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Aplicaciones</h1>
        </div>
        <a
          routerLink="/applications/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva Aplicación
        </a>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          [ngModel]="searchName()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar por nombre…"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>

        <select
          [ngModel]="pageSize()"
          (ngModelChange)="onPageSizeChange($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option [ngValue]="5">5 por página</option>
          <option [ngValue]="10">10 por página</option>
          <option [ngValue]="25">25 por página</option>
        </select>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        @if (loading()) {
          <div class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Cargando aplicaciones…
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">ID</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (app of paginated(); track app.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ app.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ app.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    @if (app.active) {
                      <svg title="Activa" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg title="Inactiva" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    }
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500">{{ app.id }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        title="Editar"
                        (click)="onEditClick(app)"
                        class="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </button>
                      @if (app.active) {
                        <button
                          type="button"
                          title="Desactivar"
                          (click)="onDeactivateClick(app)"
                          class="rounded-lg p-1.5 text-amber-500 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                    No hay aplicaciones registradas todavía
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ firstItem() }}–{{ lastItem() }} de {{ filtered().length }} aplicaciones</span>
          <div class="flex items-center gap-2">
            <button
              (click)="prevPage()"
              [disabled]="currentPage() === 1"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              ← Anterior
            </button>
            <span class="px-2">Página {{ currentPage() }} de {{ totalPages() }}</span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Siguiente →
            </button>
          </div>
        </div>
      }
    </div>

    @if (showConfirm()) {
      <app-confirm-dialog
        message="¿Desactivar esta aplicación? Podrá reactivarla desde el formulario de edición."
        (confirmed)="onDeactivateConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class ApplicationsListComponent implements OnInit {
  private readonly applicationService = inject(ApplicationService);
  private readonly editState = inject(ApplicationEditState);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly allApplications = signal<Application[]>([]);
  protected readonly loading = signal(true);
  protected readonly showConfirm = signal(false);
  private readonly pendingApp = signal<Application | null>(null);

  protected readonly searchName = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(1);

  protected readonly filtered = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    const status = this.statusFilter();
    return this.allApplications().filter((a) => {
      const matchesName = !name || a.name.toLowerCase().includes(name);
      const matchesStatus =
        status === 'all' || (status === 'active' ? a.active : !a.active);
      return matchesName && matchesStatus;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  protected readonly paginated = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return this.filtered().slice((page - 1) * size, page * size);
  });

  protected readonly firstItem = computed(() =>
    this.filtered().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );

  protected readonly lastItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filtered().length)
  );

  ngOnInit(): void {
    this.load();
  }

  protected onEditClick(app: Application): void {
    this.editState.current.set(app);
    this.router.navigate(['/applications', app.id, 'edit']);
  }

  protected onDeactivateClick(app: Application): void {
    this.pendingApp.set(app);
    this.showConfirm.set(true);
  }

  protected onDeactivateConfirmed(): void {
    const app = this.pendingApp();
    if (!app) return;
    this.showConfirm.set(false);

    const now = formatLocalDate(new Date());
    this.applicationService
      .update(app.id, {
        application: { ...app, active: false, lastUpdate: now },
        dateTime: now,
        appName: environment.appName,
        appToken: null,
      })
      .subscribe({
        next: () => {
          this.toast.success('Aplicación desactivada');
          this.load();
        },
        error: () => this.toast.error('Error al desactivar la aplicación'),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.applicationService.getAll().subscribe({
      next: (apps) => {
        this.allApplications.set(apps);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar las aplicaciones');
      },
    });
  }

  protected onSearch(value: string): void {
    this.searchName.set(value);
    this.currentPage.set(1);
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  protected onPageSizeChange(value: number): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
