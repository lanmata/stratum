import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FeatureService } from '@core/services/feature.service';
import { ToastService } from '@core/services/toast.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-feature-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/features-mgmt" class="text-sm text-blue-600 hover:underline">← Features</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit() ? 'Editar Feature' : 'Nueva Feature' }}
        </h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="space-y-5">

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input
                  formControlName="name"
                  type="text"
                  maxlength="128"
                  placeholder="Nombre de la feature"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  [class.border-red-400]="form.controls.name.invalid && form.controls.name.touched"
                />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <p class="mt-1 text-xs text-red-500">El nombre es obligatorio (máx. 128 caracteres).</p>
                }
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  maxlength="512"
                  placeholder="Descripción opcional"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                ></textarea>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="form.controls.active.setValue(!form.controls.active.value)"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
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

            </div>

            <div class="mt-6 flex justify-end gap-3">
              <a
                routerLink="/features-mgmt"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </a>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving() ? 'Guardando…' : isEdit() ? 'Guardar cambios' : 'Crear feature' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class FeatureFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly featureService = inject(FeatureService);
  private readonly toast = inject(ToastService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  private featureId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    active: [true],
  });

  ngOnInit(): void {
    this.featureId = this.route.snapshot.paramMap.get('featureId');
    if (this.featureId) {
      this.isEdit.set(true);
      this.loadForEdit(this.featureId);
    }
  }

  private loadForEdit(id: string): void {
    this.loading.set(true);
    this.featureService.getById(id).subscribe({
      next: (feature) => {
        this.form.patchValue({
          name: feature.name,
          description: feature.description ?? '',
          active: feature.active,
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la feature');
        this.loading.set(false);
        this.router.navigate(['/features-mgmt']);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { name, description, active } = this.form.getRawValue();
    const d = new Date();
    const now = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    const req = {
      feature: {
        ...(this.isEdit() && this.featureId ? { id: this.featureId } : {}),
        name,
        description,
        active,
      },
      dateTime: now,
      appName: environment.appName,
      appToken: null,
    };

    const call = this.isEdit() && this.featureId
      ? this.featureService.update(this.featureId, req)
      : this.featureService.create(req);

    call.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'Feature actualizada correctamente' : 'Feature creada correctamente');
        this.router.navigate(['/features-mgmt']);
      },
      error: () => {
        this.toast.error(this.isEdit() ? 'Error al actualizar la feature' : 'Error al crear la feature');
        this.saving.set(false);
      },
    });
  }
}
