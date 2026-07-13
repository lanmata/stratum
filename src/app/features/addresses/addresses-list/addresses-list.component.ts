import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AddressService } from '@core/services/address.service';
import { ToastService } from '@core/services/toast.service';
import { Address } from '@shared/models/address.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-addresses-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/people" class="text-sm text-blue-600 hover:underline">← Personas</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Direcciones</h1>
        </div>
        <a
          [routerLink]="['/people', personId, 'addresses', 'new']"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva Dirección
        </a>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead
              class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400"
            >
              <tr>
                <th class="px-4 py-3">Dirección</th>
                <th class="px-4 py-3">Código Postal</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (addr of addresses(); track addr.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ addr.address }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ addr.zipcode ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <a
                        [routerLink]="['/people', personId, 'addresses', addr.id, 'edit']"
                        title="Editar"
                        class="inline-flex rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </a>
                      <button
                        type="button"
                        title="Eliminar"
                        (click)="onDeleteClick(addr)"
                        class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    Esta persona no tiene direcciones registradas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showConfirm()) {
      <app-confirm-dialog
        message="¿Eliminar esta dirección? Esta acción no se puede deshacer."
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class AddressesListComponent implements OnInit {
  private readonly service = inject(AddressService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly personId = this.route.snapshot.paramMap.get('personId')!;
  protected readonly addresses = signal<Address[]>([]);
  protected readonly loading = signal(true);
  protected readonly showConfirm = signal(false);
  private readonly pendingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected onDeleteClick(addr: Address): void {
    this.pendingId.set(addr.id);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const id = this.pendingId();
    if (!id) return;
    this.showConfirm.set(false);
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Dirección eliminada');
        this.load();
      },
      error: () => this.toast.error('Error al eliminar la dirección'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.service.getByPerson(this.personId).subscribe({
      next: (data) => {
        this.addresses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las direcciones');
        this.loading.set(false);
      },
    });
  }
}
