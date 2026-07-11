import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditService } from '@core/services/audit.service';
import { AuditEvent, AuditQuery } from '@shared/models/audit.model';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
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
                <th class="px-4 py-3">Event Type</th>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (event of events(); track event.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{{ event.eventType }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ event.userId ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ event.timestamp }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron eventos</td>
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
    this.auditService.exportEvents({}).subscribe({
      next: (data) => {
        triggerCsvDownload(data);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private loadPage(): void {
    this.loading.set(true);
    const query: AuditQuery = { page: this.currentPage() - 1, size: this.pageSize() };
    this.auditService.getEvents(query).subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

function triggerCsvDownload(events: AuditEvent[]): void {
  const header = 'id,eventType,userId,applicationId,timestamp';
  const rows = events.map((e) =>
    [e.id, e.eventType, e.userId ?? '', e.applicationId ?? '', e.timestamp]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
