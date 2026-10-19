import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditService } from '@core/services/audit.service';
import { AUDIT_EVENT_TYPES, AuditEvent, AuditQuery } from '@shared/models/audit.model';

interface AuditFilters {
  eventType: string;
  userId: string;
  applicationId: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: AuditFilters = { eventType: '', userId: '', applicationId: '', from: '', to: '' };

export function toQuery(filters: AuditFilters): Omit<AuditQuery, 'page' | 'size'> {
  const query: Omit<AuditQuery, 'page' | 'size'> = {};
  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.userId.trim()) query.userId = filters.userId.trim();
  if (filters.applicationId.trim()) query.applicationId = filters.applicationId.trim();
  if (filters.from) query.from = `${filters.from}:00`;
  if (filters.to) query.to = `${filters.to}:00`;
  return query;
}

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Audit Log</h1>
        </div>
        <button
          (click)="downloadCsv()"
          [disabled]="exporting()"
          class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          @if (exporting()) {
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
            Exporting…
          } @else {
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          }
        </button>
      </div>

      <form class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" (ngSubmit)="applyFilters()">
        <select
          name="eventType"
          [ngModel]="filters().eventType"
          (ngModelChange)="patchFilters({ eventType: $event })"
          aria-label="Tipo de evento"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">Todos los eventos</option>
          @for (type of eventTypes; track type) {
            <option [value]="type">{{ type }}</option>
          }
        </select>
        <input
          type="text"
          name="userId"
          [ngModel]="filters().userId"
          (ngModelChange)="patchFilters({ userId: $event })"
          placeholder="ID de usuario"
          aria-label="ID de usuario"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <input
          type="text"
          name="applicationId"
          [ngModel]="filters().applicationId"
          (ngModelChange)="patchFilters({ applicationId: $event })"
          placeholder="ID de aplicación"
          aria-label="ID de aplicación"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <input
          type="datetime-local"
          name="from"
          [ngModel]="filters().from"
          (ngModelChange)="patchFilters({ from: $event })"
          aria-label="Desde"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <input
          type="datetime-local"
          name="to"
          [ngModel]="filters().to"
          (ngModelChange)="patchFilters({ to: $event })"
          aria-label="Hasta"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Filtrar
          </button>
          <button
            type="button"
            (click)="clearFilters()"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Limpiar
          </button>
        </div>
      </form>

      <div class="mb-4 flex flex-wrap gap-3">
        <select
          [ngModel]="pageSize()"
          (ngModelChange)="onPageSizeChange($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option [ngValue]="10">10 por página</option>
          <option [ngValue]="20">20 por página</option>
          <option [ngValue]="50">50 por página</option>
          <option [ngValue]="100">100 por página</option>
        </select>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Evento</th>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Aplicación</th>
                <th class="px-4 py-3">IP</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (event of events(); track event.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{{ event.eventType }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ event.userId ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ event.applicationId ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ event.ipAddress ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ eventDate(event) }}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ event.details ?? '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron eventos</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ firstItem() }}–{{ lastItem() }} eventos</span>
          <div class="flex items-center gap-2">
            <button
              (click)="prevPage()"
              [disabled]="currentPage() === 1"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              ← Anterior
            </button>
            <span class="px-2">Página {{ currentPage() }}</span>
            <button
              (click)="nextPage()"
              [disabled]="!hasNextPage()"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Siguiente →
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly events = signal<AuditEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly exporting = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly eventTypes = AUDIT_EVENT_TYPES;
  protected readonly filters = signal<AuditFilters>({ ...EMPTY_FILTERS });
  private appliedQuery: Omit<AuditQuery, 'page' | 'size'> = {};

  protected readonly hasNextPage = computed(() => this.events().length === this.pageSize());

  protected readonly firstItem = computed(() =>
    this.events().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );

  protected readonly lastItem = computed(() =>
    (this.currentPage() - 1) * this.pageSize() + this.events().length
  );

  ngOnInit(): void {
    this.loadPage();
  }

  protected patchFilters(patch: Partial<AuditFilters>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  protected applyFilters(): void {
    this.appliedQuery = toQuery(this.filters());
    this.currentPage.set(1);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    this.applyFilters();
  }

  protected eventDate(event: AuditEvent): string {
    return event.occurredAt ?? event.createdAt ?? '—';
  }

  protected onPageSizeChange(value: number): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
    this.loadPage();
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadPage();
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update((p) => p + 1);
      this.loadPage();
    }
  }

  protected downloadCsv(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.exporting.set(true);
    this.auditService.exportEvents(this.appliedQuery).subscribe({
      next: (data) => {
        triggerCsvDownload(data);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private loadPage(): void {
    this.loading.set(true);
    const query: AuditQuery = {
      ...this.appliedQuery,
      page: this.currentPage() - 1,
      size: this.pageSize(),
    };
    this.auditService.getEvents(query).subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

export function toCsv(events: AuditEvent[]): string {
  const header = 'id,eventType,userId,applicationId,ipAddress,occurredAt,details';
  const rows = events.map((e) =>
    [e.id, e.eventType, e.userId ?? '', e.applicationId ?? '', e.ipAddress ?? '', e.occurredAt ?? e.createdAt ?? '', e.details ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header, ...rows].join('\n');
}

function triggerCsvDownload(events: AuditEvent[]): void {
  const csv = toCsv(events);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
