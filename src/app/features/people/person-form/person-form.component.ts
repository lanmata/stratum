import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PersonService } from '@core/services/person.service';
import { ToastService } from '@core/services/toast.service';
import { PersonRequest } from '@shared/models/person.model';
import { PersonContactsComponent } from '@shared/components/person-contacts/person-contacts.component';
import { PersonAddressesComponent } from '@shared/components/person-addresses/person-addresses.component';
import { PersonIdentificationDocumentsComponent } from '@shared/components/person-identification-documents/person-identification-documents.component';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PersonContactsComponent,
    PersonAddressesComponent,
    PersonIdentificationDocumentsComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditMode() ? 'Editar Persona' : 'Nueva Persona' }}
        </h1>
      </div>

      <div class="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        @if (loadingData()) {
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                formControlName="firstName"
                type="text"
                maxlength="128"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="form.controls.firstName.invalid && form.controls.firstName.touched"
              />
              @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
                <p class="mt-1 text-xs text-red-500">El nombre es obligatorio</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Segundo nombre
              </label>
              <input
                formControlName="middleName"
                type="text"
                maxlength="128"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido <span class="text-red-500">*</span>
              </label>
              <input
                formControlName="lastName"
                type="text"
                maxlength="128"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="form.controls.lastName.invalid && form.controls.lastName.touched"
              />
              @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
                <p class="mt-1 text-xs text-red-500">El apellido es obligatorio</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
              <input
                formControlName="gender"
                type="text"
                maxlength="32"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de nacimiento
              </label>
              <input
                formControlName="birthdate"
                type="date"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <a
                routerLink="/people"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </a>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        }
      </div>

      @if (isEditMode() && personId) {
        <div class="flex flex-col gap-6">
          <app-person-contacts [personId]="personId" />
          <app-person-addresses [personId]="personId" />
          <app-person-identification-documents [personId]="personId" />
        </div>
      }
    </div>
  `,
})
export class PersonFormComponent implements OnInit {
  private readonly service = inject(PersonService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly isEditMode = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly saving = signal(false);

  protected personId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(128)]],
    middleName: ['', Validators.maxLength(128)],
    lastName: ['', [Validators.required, Validators.maxLength(128)]],
    gender: ['', Validators.maxLength(32)],
    birthdate: [''],
  });

  ngOnInit(): void {
    this.personId = this.route.snapshot.paramMap.get('personId');
    if (this.personId) {
      this.isEditMode.set(true);
      this.loadForEdit(this.personId);
    }
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { firstName, middleName, lastName, gender, birthdate } = this.form.getRawValue();
    const req: PersonRequest = {
      person: {
        id: this.personId ?? undefined,
        firstName,
        middleName: middleName || undefined,
        lastName,
        gender: gender || undefined,
        birthdate: birthdate || undefined,
      },
    };

    const call = this.isEditMode()
      ? this.service.update(this.personId!, req)
      : this.service.create(req);

    call.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Persona actualizada' : 'Persona creada');
        this.router.navigate(['/people']);
      },
      error: () => {
        this.toast.error('Error al guardar la persona');
        this.saving.set(false);
      },
    });
  }

  private loadForEdit(id: string): void {
    this.loadingData.set(true);
    this.service.getById(id).subscribe({
      next: (person) => {
        this.form.setValue({
          firstName: person.firstName,
          middleName: person.middleName ?? '',
          lastName: person.lastName,
          gender: person.gender ?? '',
          birthdate: person.birthdate ?? '',
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la persona');
        this.router.navigate(['/people']);
      },
    });
  }
}
