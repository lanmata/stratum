import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { ContactType } from '@shared/models/contact.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contact-types-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900">Tipos de Contacto</h1>
        </div>
        <a
          routerLink="/contact-types/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Tipo de Contacto
        </a>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead
              class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              <tr>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (ct of contactTypes(); track ct.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ ct.name }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ ct.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="
                        ct.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      "
                    >
                      {{ ct.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-3">
                      <a
                        [routerLink]="['/contact-types', ct.id, 'edit']"
                        class="text-blue-600 hover:underline"
                      >
                        Editar
                      </a>
                      <button
                        type="button"
                        (click)="onDeleteClick(ct)"
                        class="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400">
                    No hay tipos de contacto
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
        message="¿Eliminar este tipo de contacto? Esta acción no se puede deshacer."
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class ContactTypesListComponent implements OnInit {
  private readonly service = inject(ContactTypeService);
  private readonly toast = inject(ToastService);

  protected readonly contactTypes = signal<ContactType[]>([]);
  protected readonly loading = signal(true);
  protected readonly showConfirm = signal(false);
  private readonly pendingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected onDeleteClick(ct: ContactType): void {
    this.pendingId.set(ct.id);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const id = this.pendingId();
    if (!id) return;
    this.showConfirm.set(false);
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Tipo de contacto eliminado');
        this.load();
      },
      error: () => this.toast.error('Error al eliminar el tipo de contacto'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => {
        this.contactTypes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los tipos de contacto');
        this.loading.set(false);
      },
    });
  }
}
