import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuditService } from '@core/services/audit.service';
import { AuditEvent } from '@shared/models/audit.model';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mb-6">
        <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900">Audit Log</h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-4 py-3">Event Type</th>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (event of events(); track event.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ event.eventType }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ event.userId ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ event.timestamp }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400">No events found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AuditListComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  protected readonly events = signal<AuditEvent[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.auditService.getEvents({ page: 0, size: 50 }).subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
