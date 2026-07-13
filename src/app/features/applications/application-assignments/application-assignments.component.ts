import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApplicationRoleUserService } from '@core/services/application-role-user.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ApplicationRoleUser } from '@shared/models/application-role-user.model';
import { Role } from '@shared/models/role.model';
import { UserTO } from '@shared/models/user.model';

@Component({
  selector: 'app-application-assignments',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
        Estas asignaciones son un mecanismo adicional, independiente de la sección "Gestión de Roles" del formulario de usuario.
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando asignaciones…</p>
      } @else {
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Nueva Asignación
          </h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap items-end gap-3">
            <div class="min-w-[200px] flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Usuario</label>
              <select
                formControlName="userId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar usuario —</option>
                @for (u of users(); track u.id) {
                  <option [value]="u.id">{{ u.displayName }} ({{ u.alias }})</option>
                }
              </select>
            </div>
            <div class="min-w-[200px] flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <select
                formControlName="roleId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar rol —</option>
                @for (r of roles(); track r.id) {
                  <option [value]="r.id">{{ r.name }}</option>
                }
              </select>
            </div>
            <button
              type="submit"
              [disabled]="form.invalid || saving()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Creando…' : 'Crear asignación' }}
            </button>
          </form>
        </div>

        @if (assignments().length === 0) {
          <p class="text-sm text-gray-400 dark:text-gray-500">Esta aplicación no tiene asignaciones registradas.</p>
        } @else {
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-3">Usuario</th>
                  <th class="px-4 py-3">Rol</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (a of assignments(); track a.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ userLabel(a.userId) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ roleLabel(a.roleId) }}</td>
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
export class ApplicationAssignmentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly assignmentService = inject(ApplicationRoleUserService);
  private readonly roleService = inject(RoleService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  private readonly applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly assignments = signal<ApplicationRoleUser[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly users = signal<UserTO[]>([]);
  protected readonly showConfirm = signal(false);
  private readonly pendingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    roleId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  protected userLabel(userId: string): string {
    const u = this.users().find((x) => x.id === userId);
    return u ? `${u.displayName} (${u.alias})` : userId;
  }

  protected roleLabel(roleId: string): string {
    return this.roles().find((r) => r.id === roleId)?.name ?? roleId;
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { userId, roleId } = this.form.getRawValue();
    this.assignmentService
      .create({
        applicationRoleUser: {
          id: '',
          applicationId: this.applicationId,
          roleId,
          userId,
          active: true,
        },
      })
      .subscribe({
        next: (assignment) => {
          this.assignments.update((list) => [assignment, ...list]);
          this.form.reset({ userId: '', roleId: '' });
          this.toast.success('Asignación creada');
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Error al crear la asignación');
          this.saving.set(false);
        },
      });
  }

  protected toggleActive(a: ApplicationRoleUser): void {
    this.assignmentService
      .update(a.id, { applicationRoleUser: { ...a, active: !a.active } })
      .subscribe({
        next: (updated) => {
          this.assignments.update((list) =>
            list.map((x) => (x.id === updated.id ? updated : x))
          );
        },
        error: () => this.toast.error('Error al actualizar la asignación'),
      });
  }

  protected onDeleteClick(a: ApplicationRoleUser): void {
    this.pendingId.set(a.id);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const id = this.pendingId();
    if (!id) return;
    this.showConfirm.set(false);
    this.assignmentService.delete(id).subscribe({
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
      assignments: this.assignmentService.getByApplication(this.applicationId),
      roles: this.roleService.getAll(),
      users: this.userService.getByApplication(this.applicationId),
    }).subscribe({
      next: ({ assignments, roles, users }) => {
        this.assignments.set(assignments);
        this.roles.set(roles);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las asignaciones');
        this.loading.set(false);
      },
    });
  }
}
