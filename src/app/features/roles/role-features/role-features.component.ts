import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RoleFeatureService } from '@core/services/role-feature.service';
import { FeatureService } from '@core/services/feature.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { RoleFeature } from '@shared/models/role-feature.model';
import { Feature } from '@shared/models/feature.model';

@Component({
  selector: 'app-role-features',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/roles" class="text-sm text-blue-600 hover:underline">← Roles</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Features del Rol
        </h1>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Complementa el array embebido del rol con un estado de activación por asignación.
        </p>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Nueva Asignación
          </h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap items-end gap-3">
            <div class="min-w-[200px] flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Feature</label>
              <select
                formControlName="featureId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar feature —</option>
                @for (f of features(); track f.id) {
                  <option [value]="f.id">{{ f.name }}</option>
                }
              </select>
            </div>
            <button
              type="submit"
              [disabled]="form.invalid || saving()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Creando…' : 'Asignar feature' }}
            </button>
          </form>
        </div>

        @if (assignments().length === 0) {
          <p class="text-sm text-gray-400 dark:text-gray-500">Este rol no tiene asignaciones registradas.</p>
        } @else {
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-3">Feature</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (a of assignments(); track a.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ featureLabel(a.featureId) }}</td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        (click)="toggleActive(a)"
                        class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                        [class]="a.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                      >
                        <span
                          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                          [class]="a.active ? 'translate-x-5' : 'translate-x-1'"
                        ></span>
                      </button>
                    </td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        title="Eliminar"
                        (click)="onDeleteClick(a)"
                        class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>

    @if (showConfirm()) {
      <app-confirm-dialog
        message="¿Eliminar esta asignación? Esta acción no se puede deshacer."
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class RoleFeaturesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly roleFeatureService = inject(RoleFeatureService);
  private readonly featureService = inject(FeatureService);
  private readonly toast = inject(ToastService);

  private readonly roleId = this.route.snapshot.paramMap.get('roleId')!;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly assignments = signal<RoleFeature[]>([]);
  protected readonly features = signal<Feature[]>([]);
  protected readonly showConfirm = signal(false);
  private readonly pendingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    featureId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  protected featureLabel(featureId: string): string {
    return this.features().find((f) => f.id === featureId)?.name ?? featureId;
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { featureId } = this.form.getRawValue();
    this.roleFeatureService
      .create({ roleFeature: { id: '', roleId: this.roleId, featureId, active: true } })
      .subscribe({
        next: (assignment) => {
          this.assignments.update((list) => [assignment, ...list]);
          this.form.reset({ featureId: '' });
          this.toast.success('Feature asignada');
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Error al asignar la feature');
          this.saving.set(false);
        },
      });
  }

  protected toggleActive(a: RoleFeature): void {
    this.roleFeatureService.update(a.id, { roleFeature: { ...a, active: !a.active } }).subscribe({
      next: (updated) => {
        this.assignments.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      },
      error: () => this.toast.error('Error al actualizar la asignación'),
    });
  }

  protected onDeleteClick(a: RoleFeature): void {
    this.pendingId.set(a.id);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const id = this.pendingId();
    if (!id) return;
    this.showConfirm.set(false);
    this.roleFeatureService.delete(id).subscribe({
      next: () => {
        this.assignments.update((list) => list.filter((a) => a.id !== id));
        this.toast.success('Asignación eliminada');
      },
      error: () => this.toast.error('Error al eliminar la asignación'),
    });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      assignments: this.roleFeatureService.getByRole(this.roleId),
      features: this.featureService.getAll(),
    }).subscribe({
      next: ({ assignments, features }) => {
        this.assignments.set(assignments);
        this.features.set(features);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las asignaciones');
        this.loading.set(false);
      },
    });
  }
}
