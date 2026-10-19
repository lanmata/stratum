import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { ServiceType } from '@shared/models/service-type.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-service-types-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialogComponent],
  template: `
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Tipos de Servicio</h1>
        </div>
        <a
          routerLink="/service-types/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Tipo de Servicio
        </a>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          aria-label="Filtrar por estado"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
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
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (st of serviceTypes(); track st.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ st.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ st.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    @if (st.active) {
                      <svg title="Activo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg title="Inactivo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <a
                        [routerLink]="['/service-types', st.id, 'edit']"
                        title="Editar"
                        class="inline-flex rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </a>
                      @if (st.active) {
                        <button
                          type="button"
                          title="Desactivar"
                          (click)="onDeactivateClick(st)"
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
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No hay tipos de servicio registrados
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
        message="¿Desactivar este tipo de servicio? Podrá reactivarlo desde el formulario de edición."
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class ServiceTypesListComponent implements OnInit {
  private readonly service = inject(ServiceTypeService);
  private readonly toast = inject(ToastService);

  protected readonly serviceTypes = signal<ServiceType[]>([]);
  protected readonly loading = signal(true);
  protected readonly showConfirm = signal(false);
  private readonly pendingServiceType = signal<ServiceType | null>(null);
  protected readonly statusFilter = signal<StatusFilter>('all');

  ngOnInit(): void {
    this.load();
  }

  protected onDeactivateClick(st: ServiceType): void {
    this.pendingServiceType.set(st);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const st = this.pendingServiceType();
    if (!st) return;
    this.showConfirm.set(false);
    this.service.update(st.id, { serviceType: { ...st, active: false } }).subscribe({
      next: () => {
        this.toast.success('Tipo de servicio desactivado');
        this.load();
      },
      error: () => this.toast.error('Error al desactivar el tipo de servicio'),
    });
  }

  protected onStatusChange(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const status = this.statusFilter();
    const source$ =
      status === 'all' ? this.service.getAll() : this.service.getByStatus(status === 'active');
    source$.subscribe({
      next: (data) => {
        this.serviceTypes.set(
          status === 'all' ? data : data.filter((st) => st.active === (status === 'active')),
        );
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los tipos de servicio');
        this.loading.set(false);
      },
    });
  }
}
