import { Component, inject, input, OnChanges, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentificationDocumentService } from '@core/services/identification-document.service';
import { ToastService } from '@core/services/toast.service';
import {
  IdentificationDocument,
  IDENTIFICATION_TYPE_PASSPORT,
  IDENTIFICATION_TYPE_IDENTIFICATION,
} from '@shared/models/identification-document.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-person-identification-documents',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Documentos de identificación
        </h2>
        @if (!showForm()) {
          <button
            type="button"
            (click)="startCreate()"
            class="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            + Agregar documento
          </button>
        }
      </div>

      @if (loading()) {
        <p class="text-xs text-gray-400 dark:text-gray-500">Cargando documentos…</p>
      } @else {
        @if (documents().length === 0 && !showForm()) {
          <p class="text-xs text-gray-400 dark:text-gray-500">Esta persona no tiene documentos registrados.</p>
        }

        <ul class="space-y-2">
          @for (doc of documents(); track doc.id) {
            <li class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600">
              <span class="text-gray-800 dark:text-gray-200">
                {{ typeLabel(doc.identificationType) }}: {{ doc.number }}
                @if (doc.expirationDate) {
                  <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">vence {{ doc.expirationDate }}</span>
                }
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Editar"
                  (click)="startEdit(doc)"
                  class="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  (click)="onDeleteClick(doc)"
                  class="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </li>
          }
        </ul>

        @if (showForm()) {
          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/40">
            <div>
              <select
                formControlName="identificationType"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option [value]="identificationTypeIdentification">Cédula / Documento de identificación</option>
                <option [value]="identificationTypePassport">Pasaporte</option>
              </select>
            </div>
            <div>
              <input
                formControlName="number"
                type="text"
                maxlength="64"
                placeholder="Número *"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="submitted() && form.controls.number.invalid"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Fecha de vencimiento</label>
              <input
                formControlName="expirationDate"
                type="date"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button
                type="button"
                (click)="cancelForm()"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        }
      }
    </div>

    @if (deleteTarget()) {
      <app-confirm-dialog
        message="¿Eliminar este documento? Esta acción no se puede deshacer."
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="deleteTarget.set(null)"
      />
    }
  `,
})
export class PersonIdentificationDocumentsComponent implements OnChanges {
  readonly personId = input.required<string>();

  protected readonly identificationTypePassport = IDENTIFICATION_TYPE_PASSPORT;
  protected readonly identificationTypeIdentification = IDENTIFICATION_TYPE_IDENTIFICATION;

  private readonly documentService = inject(IdentificationDocumentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly documents = signal<IdentificationDocument[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly showForm = signal(false);
  protected readonly deleteTarget = signal<IdentificationDocument | null>(null);
  private editingId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    identificationType: [IDENTIFICATION_TYPE_IDENTIFICATION],
    number: ['', [Validators.required, Validators.maxLength(64)]],
    expirationDate: [''],
  });

  ngOnChanges(): void {
    this.load();
  }

  protected typeLabel(type: number): string {
    return type === IDENTIFICATION_TYPE_PASSPORT ? 'Pasaporte' : 'Cédula';
  }

  private load(): void {
    this.loading.set(true);
    this.documentService.getByPerson(this.personId()).subscribe({
      next: (data) => {
        this.documents.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los documentos');
        this.loading.set(false);
      },
    });
  }

  protected startCreate(): void {
    this.editingId = null;
    this.submitted.set(false);
    this.form.reset({ identificationType: IDENTIFICATION_TYPE_IDENTIFICATION, number: '', expirationDate: '' });
    this.showForm.set(true);
  }

  protected startEdit(doc: IdentificationDocument): void {
    this.editingId = doc.id ?? null;
    this.submitted.set(false);
    this.form.setValue({
      identificationType: doc.identificationType,
      number: doc.number,
      expirationDate: doc.expirationDate ?? '',
    });
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.saving.set(true);

    const { identificationType, number, expirationDate } = this.form.getRawValue();
    const document: IdentificationDocument = {
      id: this.editingId ?? undefined,
      number,
      expirationDate: expirationDate || undefined,
      identificationType,
      personId: this.personId(),
    };

    const call = this.editingId
      ? this.documentService.update(this.editingId, { identificationDocument: document })
      : this.documentService.create({ identificationDocument: document });

    call.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Documento actualizado' : 'Documento agregado');
        this.showForm.set(false);
        this.saving.set(false);
        this.load();
      },
      error: () => {
        this.toast.error('Error al guardar el documento');
        this.saving.set(false);
      },
    });
  }

  protected onDeleteClick(doc: IdentificationDocument): void {
    this.deleteTarget.set(doc);
  }

  protected onDeleteConfirmed(): void {
    const doc = this.deleteTarget();
    if (!doc?.id) return;
    this.deleteTarget.set(null);
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.toast.success('Documento eliminado');
        this.load();
      },
      error: () => this.toast.error('Error al eliminar el documento'),
    });
  }
}
