import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/roles" class="text-sm text-blue-600 hover:underline">← Roles</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit() ? 'Editar Rol' : 'Nuevo Rol' }}
        </h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="space-y-5">

              <!-- Nombre -->
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input
                  formControlName="name"
                  type="text"
                  maxlength="128"
                  placeholder="Nombre del rol"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  [class.border-red-400]="form.controls.name.invalid && form.controls.name.touched"
                />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <p class="mt-1 text-xs text-red-500">El nombre es obligatorio (máx. 128 caracteres).</p>
                }
              </div>

              <!-- Descripción -->
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

              <!-- Estado del rol -->
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
                  {{ form.controls.active.value ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

            </div>

            <div class="mt-6 flex justify-end gap-3">
              <a
                routerLink="/roles"
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </a>
              <button
                type="submit"
                [disabled]="form.invalid"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isEdit() ? 'Guardar cambios' : 'Crear rol' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class RoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  private roleId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    active: [true],
  });

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('roleId');
    if (this.roleId) {
      this.isEdit.set(true);
      this.loadForEdit(this.roleId);
    }
  }

  private loadForEdit(id: string): void {
    this.loading.set(true);
    this.roleService.getById(id).subscribe({
      next: (role) => {
        this.form.patchValue({
          name: role.name,
          description: role.description ?? '',
          active: role.active,
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el rol');
        this.loading.set(false);
        this.router.navigate(['/roles']);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;

    const { name, description, active } = this.form.getRawValue();
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const req = {
      role: {
        ...(this.isEdit() && this.roleId ? { id: this.roleId } : {}),
        name,
        description,
        active,
      },
      dateTime,
      appName: environment.appName,
      appToken: null,
    };

    if (this.isEdit() && this.roleId) {
      this.roleService.update(this.roleId, req).subscribe({
        next: () => {
          this.toast.success('Rol actualizado correctamente');
          this.router.navigate(['/roles']);
        },
        error: () => this.toast.error('Error al actualizar el rol'),
      });
    } else {
      this.roleService.create(req).subscribe({
        next: () => {
          this.toast.success('Rol creado correctamente');
          this.router.navigate(['/roles']);
        },
        error: () => this.toast.error('Error al crear el rol'),
      });
    }
  }
}
