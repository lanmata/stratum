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
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Tipos de Contacto</h1>
        </div>
        <a
          routerLink="/contact-types/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Tipo de Contacto
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
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (ct of contactTypes(); track ct.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ ct.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ ct.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    @if (ct.active) {
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
                        [routerLink]="['/contact-types', ct.id, 'edit']"
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
                        (click)="onDeleteClick(ct)"
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
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
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
