import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { ServiceTypeRequest } from '@shared/models/service-type.model';

@Component({
  selector: 'app-service-type-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/service-types" class="text-sm text-blue-600 hover:underline">
          ← Tipos de Servicio
        </a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditMode() ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio' }}
        </h1>
      </div>

      <div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        @if (loadingData()) {
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre <span class="text-red-500">*</span>
              </label>
              <input
                formControlName="name"
                type="text"
                maxlength="128"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="form.controls.name.invalid && form.controls.name.touched"
              />
              @if (form.controls.name.invalid && form.controls.name.touched) {
                <p class="mt-1 text-xs text-red-500">El nombre es obligatorio</p>
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
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              ></textarea>
            </div>

            <div class="flex items-center gap-3">
              <label class="relative inline-flex cursor-pointer items-center">
                <input formControlName="active" type="checkbox" class="peer sr-only" />
                <div
                  class="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-gray-600"
                ></div>
              </label>
              <span class="text-sm text-gray-700 dark:text-gray-300">Activo</span>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <a
                routerLink="/service-types"
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
    </div>
  `,
})
export class ServiceTypeFormComponent implements OnInit {
  private readonly service = inject(ServiceTypeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly isEditMode = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly saving = signal(false);

  private serviceTypeId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    active: [true],
  });

  ngOnInit(): void {
    this.serviceTypeId = this.route.snapshot.paramMap.get('serviceTypeId');
    if (this.serviceTypeId) {
      this.isEditMode.set(true);
      this.loadForEdit(this.serviceTypeId);
    }
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { name, description, active } = this.form.getRawValue();
    const req: ServiceTypeRequest = {
      serviceType: {
        id: this.serviceTypeId ?? '',
        name,
        description: description || undefined,
        active,
      },
    };

    const call = this.isEditMode()
      ? this.service.update(this.serviceTypeId!, req)
      : this.service.create(req);

    call.subscribe({
      next: () => {
        this.toast.success(
          this.isEditMode() ? 'Tipo de servicio actualizado' : 'Tipo de servicio creado'
        );
        this.router.navigate(['/service-types']);
      },
      error: () => {
        this.toast.error('Error al guardar el tipo de servicio');
        this.saving.set(false);
      },
    });
  }

  private loadForEdit(id: string): void {
    this.loadingData.set(true);
    this.service.getById(id).subscribe({
      next: (st) => {
        this.form.setValue({
          name: st.name,
          description: st.description ?? '',
          active: st.active,
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el tipo de servicio');
        this.router.navigate(['/service-types']);
      },
    });
  }
}
