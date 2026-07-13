import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService } from '@core/services/application.service';
import { ApplicationEditState } from '@core/services/application-edit.state';
import { ServiceTypeService } from '@core/services/service-type.service';
import { StorageMockService } from '@core/services/storage-mock.service';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';
import { ServiceType } from '@shared/models/service-type.model';
import { environment } from '@env/environment';

const APPS_STORAGE_KEY = 'stratum.applications';

function formatLocalDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/applications" class="text-sm text-blue-600 hover:underline">
          ← Aplicaciones
        </a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditMode() ? 'Editar Aplicación' : 'Nueva Aplicación' }}
        </h1>
      </div>

      <div class="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                formControlName="name"
                type="text"
                maxlength="128"
                placeholder="Mi aplicación"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                [class.border-red-400]="form.controls.name.invalid && form.controls.name.touched"
              />
              @if (form.controls.name.invalid && form.controls.name.touched) {
                <p class="mt-1 text-xs text-red-500">El nombre es obligatorio (máx. 128 caracteres).</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                formControlName="description"
                rows="3"
                maxlength="512"
                placeholder="Descripción opcional"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              ></textarea>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Servicio <span class="text-red-500">*</span>
              </label>
              @if (loadingServiceTypes()) {
                <p class="text-xs text-gray-400 dark:text-gray-500">Cargando tipos de servicio…</p>
              } @else {
                <select
                  formControlName="serviceTypeId"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  [class.border-red-400]="form.controls.serviceTypeId.invalid && form.controls.serviceTypeId.touched"
                >
                  <option value="">— Seleccionar tipo de servicio —</option>
                  @for (st of serviceTypes(); track st.id) {
                    <option [value]="st.id">{{ st.name }}</option>
                  }
                </select>
                @if (form.controls.serviceTypeId.invalid && form.controls.serviceTypeId.touched) {
                  <p class="mt-1 text-xs text-red-500">El tipo de servicio es obligatorio.</p>
                }
              }
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="form.controls.active.setValue(!form.controls.active.value)"
                class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                [class]="form.controls.active.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                role="switch"
                [attr.aria-checked]="form.controls.active.value"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  [class]="form.controls.active.value ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ form.controls.active.value ? 'Activa' : 'Inactiva' }}
              </span>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <a
                routerLink="/applications"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </a>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving() ? 'Guardando…' : (isEditMode() ? 'Guardar cambios' : 'Crear aplicación') }}
              </button>
            </div>

        </form>
      </div>
    </div>
  `,
})
export class ApplicationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly applicationService = inject(ApplicationService);
  private readonly editState = inject(ApplicationEditState);
  private readonly serviceTypeService = inject(ServiceTypeService);
  private readonly storage = inject(StorageMockService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly serviceTypes = signal<ServiceType[]>([]);
  protected readonly loadingServiceTypes = signal(true);

  private applicationId: string | null = null;
  private originalCreatedDate: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    serviceTypeId: ['', Validators.required],
    active: [true],
  });

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('applicationId');
    if (this.applicationId) {
      this.isEditMode.set(true);
      const app = this.editState.current();
      if (app && app.id === this.applicationId) {
        this.populateForm(app);
      } else {
        this.toast.error('No se encontraron los datos de la aplicación');
        this.router.navigate(['/applications']);
        return;
      }
    }

    this.serviceTypeService.getAll().subscribe({
      next: (types) => {
        this.serviceTypes.set(types.filter((t) => t.active));
        this.loadingServiceTypes.set(false);
      },
      error: () => this.loadingServiceTypes.set(false),
    });
  }

  private populateForm(app: Application): void {
    this.originalCreatedDate = app.createdDate ?? null;
    this.form.setValue({
      name: app.name,
      description: app.description ?? '',
      serviceTypeId: app.serviceTypeId ?? '',
      active: app.active,
    });
  }

  private persistLocally(app: Application): void {
    const stored = this.storage.getItem(APPS_STORAGE_KEY);
    const list: Application[] = stored ? (JSON.parse(stored) as Application[]) : [];
    const now = formatLocalDate(new Date());
    if (this.isEditMode()) {
      const idx = list.findIndex((a) => a.id === app.id);
      if (idx >= 0) list[idx] = { ...app, lastUpdate: now };
      else list.unshift({ ...app, lastUpdate: now });
    } else {
      list.unshift({ ...app, createdDate: app.createdDate ?? now, lastUpdate: app.lastUpdate ?? now });
    }
    this.storage.setItem(APPS_STORAGE_KEY, JSON.stringify(list));
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { name, description, active, serviceTypeId } = this.form.getRawValue();
    const now = formatLocalDate(new Date());

    if (this.isEditMode()) {
      this.applicationService
        .update(this.applicationId!, {
          application: {
            id: this.applicationId!,
            name,
            description: description || undefined,
            active,
            serviceTypeId,
            createdDate: this.originalCreatedDate ?? now,
            lastUpdate: now,
          },
          dateTime: now,
          appName: environment.appName,
          appToken: null,
        })
        .subscribe({
          next: (app) => {
            this.persistLocally(app);
            this.toast.success('Aplicación actualizada');
            this.router.navigate(['/applications']);
          },
          error: () => {
            this.toast.error('Error al actualizar la aplicación');
            this.saving.set(false);
          },
        });
    } else {
      this.applicationService
        .create({
          application: {
            name,
            ...(description ? { description } : {}),
            active,
            serviceTypeId,
            createdDate: now,
            lastUpdate: now,
          },
          dateTime: now,
          appName: environment.appName,
          appToken: null,
        })
        .subscribe({
          next: (app) => {
            this.persistLocally(app);
            this.toast.info(`Aplicación creada. ID: ${app.id}`, 0, app.id);
            this.router.navigate(['/applications']);
          },
          error: () => {
            this.toast.error('Error al crear la aplicación');
            this.saving.set(false);
          },
        });
    }
  }
}
