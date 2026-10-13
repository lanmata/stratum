import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RoleService } from '@core/services/role.service';
import { FeatureService } from '@core/services/feature.service';
import { ToastService } from '@core/services/toast.service';
import { environment } from '@env/environment';
import { emptyPage, Page } from '@shared/models/page.model';
import { FeatureSummary } from '@shared/models/feature.model';

const PICKER_PAGE_SIZE = 5;
const PICKER_MIN_QUERY = 2;
const PICKER_DEBOUNCE_MS = 300;

interface FeatureEntry {
  id: string;
  backendId?: string;
  /** An existing catalog feature linked to this role (create mode): shared, so read-only. */
  linked?: boolean;
  name: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit() ? 'Editar Rol' : 'Nuevo Rol' }}
        </h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="mx-auto max-w-2xl space-y-4">

          <!-- Role fields -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <form [formGroup]="form" id="roleForm" (ngSubmit)="submit()">
              <div class="space-y-5">

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
                    [class.border-red-400]="submitted() && form.controls.name.invalid"
                  />
                  @if (submitted() && form.controls.name.invalid) {
                    <p class="mt-1 text-xs text-red-500">El nombre es obligatorio (máx. 128 caracteres).</p>
                  }
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                  <textarea
                    formControlName="description"
                    rows="2"
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
                    {{ form.controls.active.value ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>

              </div>
            </form>
          </div>

          <!-- Inline features -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="mb-4 flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Funcionalidades <span class="text-red-500">*</span>
              </p>
              <button
                type="button"
                (click)="addFeature()"
                class="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                + Agregar funcionalidad
              </button>
            </div>

            @if (!isEdit()) {
              <div class="mb-4 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
                <p class="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Vincular funcionalidades existentes (opcional)
                </p>
                <input
                  type="text"
                  [ngModel]="pickerQuery()"
                  (ngModelChange)="onPickerQuery($event)"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Buscar funcionalidad por nombre…"
                  aria-label="Buscar funcionalidad existente"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
                @if (pickerSearched()) {
                  <ul class="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
                    @for (f of pickerResults().content; track f.id) {
                      <li class="flex items-center justify-between py-1.5 text-sm">
                        <span class="text-gray-800 dark:text-gray-200">
                          {{ f.name }}
                          @if (f.description) {
                            <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">{{ f.description }}</span>
                          }
                        </span>
                        <button
                          type="button"
                          (click)="linkFeature(f)"
                          [disabled]="isLinked(f.id)"
                          class="rounded-lg border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          {{ isLinked(f.id) ? 'Vinculada' : 'Vincular' }}
                        </button>
                      </li>
                    } @empty {
                      <li class="py-2 text-xs text-gray-400 dark:text-gray-500">Sin resultados.</li>
                    }
                  </ul>
                  @if (pickerResults().totalPages > 1) {
                    <div class="mt-2 flex items-center justify-end gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <button type="button" (click)="pickerGoTo(pickerResults().page - 1)" [disabled]="pickerResults().page === 0" class="rounded border border-gray-300 px-2 py-1 disabled:opacity-40 dark:border-gray-600">← Anterior</button>
                      <span>Página {{ pickerResults().page + 1 }} de {{ pickerResults().totalPages }}</span>
                      <button type="button" (click)="pickerGoTo(pickerResults().page + 1)" [disabled]="pickerResults().page + 1 >= pickerResults().totalPages" class="rounded border border-gray-300 px-2 py-1 disabled:opacity-40 dark:border-gray-600">Siguiente →</button>
                    </div>
                  }
                } @else {
                  <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Escribe al menos 2 caracteres. El catálogo no se muestra completo.
                  </p>
                }
              </div>
            }

            <div class="space-y-3">
              @for (entry of featureEntries(); track entry.id; let i = $index) {
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/40">
                  <div class="mb-3 flex items-center justify-between">
                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Funcionalidad {{ i + 1 }}</span>
                    <button
                      type="button"
                      (click)="removeFeature(i)"
                      [disabled]="featureEntries().length === 1 || (entry.backendId && !entry.linked && !entry.active)"
                      [title]="entry.backendId && !entry.linked ? 'Desactivar' : 'Eliminar'"
                      class="rounded p-0.5 text-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>

                  @if (entry.linked) {
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {{ entry.name }}
                      <span class="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Vinculada</span>
                    </p>
                    @if (entry.description) {
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ entry.description }}</p>
                    }
                  } @else {
                  <div class="space-y-2">
                    <div>
                      <input
                        type="text"
                        maxlength="128"
                        placeholder="Nombre *"
                        [value]="entry.name"
                        (input)="updateFeature(i, 'name', $any($event.target).value)"
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                        [class.border-red-400]="submitted() && !entry.name.trim()"
                      />
                      @if (submitted() && !entry.name.trim()) {
                        <p class="mt-1 text-xs text-red-500">El nombre de la funcionalidad es obligatorio.</p>
                      }
                    </div>
                    <input
                      type="text"
                      maxlength="512"
                      placeholder="Descripción (opcional)"
                      [value]="entry.description"
                      (input)="updateFeature(i, 'description', $any($event.target).value)"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="updateFeature(i, 'active', !entry.active)"
                        class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                        [class]="entry.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                        role="switch"
                        [attr.aria-checked]="entry.active"
                      >
                        <span
                          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                          [class]="entry.active ? 'translate-x-4' : 'translate-x-1'"
                        ></span>
                      </button>
                      <span class="text-xs text-gray-600 dark:text-gray-400">{{ entry.active ? 'Activa' : 'Inactiva' }}</span>
                    </div>
                  </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pb-6">
            <a
              [routerLink]="['/applications', applicationId, 'roles']"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </a>
            <button
              type="button"
              (click)="submit()"
              [disabled]="saving()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Guardando…' : isEdit() ? 'Guardar cambios' : 'Crear rol' }}
            </button>
          </div>
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
  private readonly featureService = inject(FeatureService);
  private readonly toast = inject(ToastService);

  protected readonly applicationId = this.route.snapshot.paramMap.get('applicationId')!;
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly featureEntries = signal<FeatureEntry[]>([this.emptyFeature()]);
  private roleId: string | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private readonly pickerQuery$ = new Subject<string>();
  protected readonly pickerQuery = signal('');
  protected readonly pickerSearched = signal(false);
  protected readonly pickerResults = signal<Page<FeatureSummary>>(emptyPage(PICKER_PAGE_SIZE));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: ['', Validators.maxLength(512)],
    active: [true],
  });

  constructor() {
    this.pickerQuery$
      .pipe(
        debounceTime(PICKER_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.searchPicker(0));
  }

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('roleId');

    if (this.roleId) {
      this.isEdit.set(true);
      this.roleService.getById(this.roleId).subscribe({
        next: (role) => {
          this.form.patchValue({
            name: role.name,
            description: role.description ?? '',
            active: role.active,
          });
          if (role.features?.length) {
            this.featureEntries.set(
              role.features.map((f) => ({
                id: f.id,
                backendId: f.id,
                name: f.name,
                description: f.description ?? '',
                active: f.active,
              })),
            );
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar el rol');
          this.router.navigate(['/applications', this.applicationId, 'roles']);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  protected onPickerQuery(value: string): void {
    this.pickerQuery.set(value);
    this.pickerQuery$.next(value.trim());
  }

  protected pickerGoTo(page: number): void {
    if (page < 0 || page >= this.pickerResults().totalPages) return;
    this.searchPicker(page);
  }

  protected isLinked(featureId: string): boolean {
    return this.featureEntries().some((e) => e.backendId === featureId);
  }

  protected linkFeature(feature: FeatureSummary): void {
    if (this.isLinked(feature.id)) return;
    const entry: FeatureEntry = {
      id: feature.id,
      backendId: feature.id,
      linked: true,
      name: feature.name,
      description: feature.description ?? '',
      active: feature.active,
    };
    this.featureEntries.update((list) => {
      const onlyPlaceholder = list.length === 1 && !list[0].name.trim() && !list[0].description.trim();
      return onlyPlaceholder ? [entry] : [...list, entry];
    });
  }

  private searchPicker(page: number): void {
    const q = this.pickerQuery().trim();
    if (q.length < PICKER_MIN_QUERY) {
      this.pickerSearched.set(false);
      this.pickerResults.set(emptyPage(PICKER_PAGE_SIZE));
      return;
    }
    this.pickerSearched.set(true);
    this.featureService.search({ q, active: true, page, size: PICKER_PAGE_SIZE }).subscribe({
      next: (result) => this.pickerResults.set(result),
      error: () => this.toast.error('Error al buscar funcionalidades'),
    });
  }

  protected addFeature(): void {
    this.featureEntries.update((list) => [...list, this.emptyFeature()]);
  }

  protected removeFeature(index: number): void {
    if (this.featureEntries().length === 1) return;
    const entry = this.featureEntries()[index];
    // The API has no DELETE for features — an already-persisted feature can
    // only be deactivated, not removed, or it would silently reappear the
    // next time this role is loaded (GET still returns inactive features).
    if (entry.backendId && !entry.linked) {
      this.updateFeature(index, 'active', false);
      return;
    }
    this.featureEntries.update((list) => list.filter((_, i) => i !== index));
  }

  protected updateFeature(index: number, field: keyof FeatureEntry, value: string | boolean): void {
    this.featureEntries.update((list) =>
      list.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    );
  }

  protected submit(): void {
    this.submitted.set(true);

    const entries = this.featureEntries();
    const hasInvalidFeature = entries.some((e) => !e.name.trim());
    if (this.form.invalid || hasInvalidFeature) return;

    this.saving.set(true);

    const { name, description, active } = this.form.getRawValue();
    const dateTime = this.nowDateTime();

    if (this.isEdit() && this.roleId) {
      const req = {
        role: { id: this.roleId, name, description, applicationId: this.applicationId, active },
        dateTime,
        appName: environment.appName,
        appToken: null,
      };
      this.roleService.update(this.roleId, req).subscribe({
        next: () => this.saveFeaturesForEdit(this.roleId!),
        error: () => {
          this.toast.error('Error al actualizar el rol');
          this.saving.set(false);
        },
      });
    } else {
      // POST /roles/ creates features inline when they carry no id; an id
      // would be treated as a reference to an existing feature (404 if absent).
      const req = {
        role: {
          name,
          description,
          applicationId: this.applicationId,
          active,
          features: this.featureEntries().map((e) => ({
            ...(e.linked ? { id: e.backendId } : {}),
            name: e.name.trim(),
            description: e.description.trim() || undefined,
            active: e.active,
          })),
        },
        dateTime,
        appName: environment.appName,
        appToken: null,
      };
      this.roleService.create(req).subscribe({
        next: () => {
          this.toast.success('Rol creado correctamente');
          this.router.navigate(['/applications', this.applicationId, 'roles']);
        },
        error: () => {
          this.toast.error('Error al crear el rol');
          this.saving.set(false);
        },
      });
    }
  }

  private saveFeaturesForEdit(roleId: string): void {
    const requests: Observable<unknown>[] = this.featureEntries().map((e) => {
      const base = {
        name: e.name.trim(),
        description: e.description.trim() || undefined,
        active: e.active,
      };
      const req = {
        feature: e.backendId ? { ...base, id: e.backendId } : { ...base, roleIds: [roleId] },
        dateTime: this.nowDateTime(),
        appName: environment.appName,
        appToken: null,
      };
      return e.backendId ? this.featureService.update(e.backendId, req) : this.featureService.create(req);
    });

    (requests.length ? forkJoin(requests) : of([])).subscribe({
      next: () => {
        this.toast.success('Rol actualizado correctamente');
        this.router.navigate(['/applications', this.applicationId, 'roles']);
      },
      error: () => {
        this.toast.error('El rol se guardó, pero hubo un error al guardar sus funcionalidades');
        this.saving.set(false);
      },
    });
  }

  private nowDateTime(): string {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
  }

  private emptyFeature(): FeatureEntry {
    return { id: crypto.randomUUID(), name: '', description: '', active: true };
  }
}
