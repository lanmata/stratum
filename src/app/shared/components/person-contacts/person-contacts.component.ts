import { Component, inject, input, OnChanges, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Contact, ContactType } from '@shared/models/contact.model';
import { contactContentValidator, notBlankValidator } from '@shared/utils/contact-validators';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-person-contacts',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contactos</h2>
        @if (!showForm()) {
          <button
            type="button"
            (click)="startCreate()"
            class="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            + Agregar contacto
          </button>
        }
      </div>

      @if (loading()) {
        <p class="text-xs text-gray-400 dark:text-gray-500">Cargando contactos…</p>
      } @else {
        @if (contacts().length === 0 && !showForm()) {
          <p class="text-xs text-gray-400 dark:text-gray-500">Esta persona no tiene contactos registrados.</p>
        }

        <ul class="space-y-2">
          @for (contact of contacts(); track contact.id) {
            <li class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600">
              <span class="text-gray-800 dark:text-gray-200">
                {{ contact.content }}
                <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">({{ contact.contactType.name }})</span>
                @if (!contact.active) {
                  <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">Inactivo</span>
                }
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Editar"
                  (click)="startEdit(contact)"
                  class="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  (click)="onDeleteClick(contact)"
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
              <input
                formControlName="content"
                type="text"
                maxlength="256"
                placeholder="Contacto (email, teléfono, etc.) *"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="submitted() && form.controls.content.invalid"
              />
              @if (submitted() && form.controls.content.errors; as e) {
                <p class="mt-1 text-xs text-red-500">
                  @if (e['required'] || e['blank']) { El contacto es obligatorio }
                  @else if (e['email']) { Correo electrónico inválido }
                  @else if (e['phone']) { Número de teléfono inválido }
                  @else { Contacto inválido }
                </p>
              }
            </div>
            <div>
              <select
                formControlName="contactTypeId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="submitted() && form.controls.contactTypeId.invalid"
              >
                <option value="" disabled>Tipo de contacto *</option>
                @for (ct of contactTypes(); track ct.id) {
                  <option [value]="ct.id">{{ ct.name }}</option>
                }
              </select>
              @if (submitted() && form.controls.contactTypeId.invalid) {
                <p class="mt-1 text-xs text-red-500">Selecciona un tipo de contacto</p>
              }
            </div>
            <div class="flex items-center gap-2">
              <input formControlName="active" type="checkbox" id="contactActive" class="h-4 w-4 rounded border-gray-300" />
              <label for="contactActive" class="text-xs text-gray-600 dark:text-gray-400">Activo</label>
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
        message="¿Eliminar este contacto? Esta acción no se puede deshacer."
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="deleteTarget.set(null)"
      />
    }
  `,
})
export class PersonContactsComponent implements OnChanges {
  readonly personId = input.required<string>();

  private readonly contactService = inject(ContactService);
  private readonly contactTypeService = inject(ContactTypeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly contacts = signal<Contact[]>([]);
  protected readonly contactTypes = signal<ContactType[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly showForm = signal(false);
  protected readonly deleteTarget = signal<Contact | null>(null);
  private editingId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    content: [
      '',
      [
        Validators.required,
        Validators.maxLength(256),
        notBlankValidator,
        contactContentValidator(() => this.selectedTypeName()),
      ],
    ],
    contactTypeId: ['', Validators.required],
    active: [true],
  });

  constructor() {
    this.form.controls.contactTypeId.valueChanges.subscribe(() =>
      this.form.controls.content.updateValueAndValidity(),
    );
  }

  private selectedTypeName(): string | undefined {
    const id = this.form.controls.contactTypeId.value;
    return this.contactTypes().find((ct) => ct.id === id)?.name;
  }

  ngOnChanges(): void {
    this.contactTypeService.getAll().subscribe((types) => this.contactTypes.set(types));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.contactService.getByPerson(this.personId()).subscribe({
      next: (data) => {
        this.contacts.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los contactos');
        this.loading.set(false);
      },
    });
  }

  protected startCreate(): void {
    this.editingId = null;
    this.submitted.set(false);
    this.form.reset({ content: '', contactTypeId: '', active: true });
    this.showForm.set(true);
  }

  protected startEdit(contact: Contact): void {
    this.editingId = contact.id ?? null;
    this.submitted.set(false);
    this.form.setValue({
      content: contact.content,
      contactTypeId: contact.contactType.id,
      active: contact.active,
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

    const { content, contactTypeId, active } = this.form.getRawValue();
    const contactType = this.contactTypes().find((ct) => ct.id === contactTypeId)!;
    const contact: Contact = {
      id: this.editingId ?? undefined,
      content: content.trim(),
      contactType,
      personId: this.personId(),
      active,
    };

    const call = this.editingId
      ? this.contactService.update(this.editingId, contact)
      : this.contactService.create(contact);

    call.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Contacto actualizado' : 'Contacto agregado');
        this.showForm.set(false);
        this.saving.set(false);
        this.load();
      },
      error: () => {
        this.toast.error('Error al guardar el contacto');
        this.saving.set(false);
      },
    });
  }

  protected onDeleteClick(contact: Contact): void {
    this.deleteTarget.set(contact);
  }

  protected onDeleteConfirmed(): void {
    const contact = this.deleteTarget();
    if (!contact?.id) return;
    this.deleteTarget.set(null);
    this.contactService.delete(contact.id).subscribe({
      next: () => {
        this.toast.success('Contacto eliminado');
        this.load();
      },
      error: () => this.toast.error('Error al eliminar el contacto'),
    });
  }
}
