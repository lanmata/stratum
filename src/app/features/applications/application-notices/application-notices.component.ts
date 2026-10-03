import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NoticeService } from '@core/services/notice.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { Notice } from '@shared/models/notice.model';
import { NoticeType } from '@shared/models/notice-type.model';
import { UserTO } from '@shared/models/user.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-application-notices',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Avisos</h2>
        @if (!showForm()) {
          <button
            type="button"
            (click)="startCreate()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Registrar Aviso
          </button>
        }
      </div>

      @if (showForm()) {
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div>
            <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Usuario *</label>
            <select
              formControlName="userId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="" disabled>Seleccionar usuario</option>
              @for (u of users(); track u.id) {
                <option [value]="u.id">{{ u.displayName || u.alias }}</option>
              }
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Tipo de aviso *</label>
            <select
              formControlName="noticeTypeId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="" disabled>Seleccionar tipo de aviso</option>
              @for (nt of noticeTypes(); track nt.id) {
                <option [value]="nt.id">{{ nt.name }}</option>
              }
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="showForm.set(false)"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || saving()"
              class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Guardando…' : 'Registrar' }}
            </button>
          </div>
        </form>
      }

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando avisos…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Tipo de aviso</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (notice of notices(); track notice.userId + notice.noticeTypeId) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ userLabel(notice.userId) }}</td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ noticeTypeLabel(notice.noticeTypeId) }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ notice.createdAt ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      title="Revocar"
                      (click)="onDeleteClick(notice)"
                      class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No hay avisos registrados</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (deleteTarget()) {
      <app-confirm-dialog
        message="¿Revocar este aviso? Esta acción no se puede deshacer."
        (confirmed)="onDeleteConfirmed()"
        (cancelled)="deleteTarget.set(null)"
      />
    }
  `,
})
export class ApplicationNoticesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly noticeService = inject(NoticeService);
  private readonly noticeTypeService = inject(NoticeTypeService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  private readonly applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;

  protected readonly notices = signal<Notice[]>([]);
  protected readonly noticeTypes = signal<NoticeType[]>([]);
  protected readonly users = signal<UserTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly deleteTarget = signal<Notice | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    noticeTypeId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  protected userLabel(userId: string): string {
    const user = this.users().find((u) => u.id === userId);
    return user ? user.displayName || user.alias : userId;
  }

  protected noticeTypeLabel(noticeTypeId: string): string {
    return this.noticeTypes().find((nt) => nt.id === noticeTypeId)?.name ?? noticeTypeId;
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      notices: this.noticeService.getByApplication(this.applicationId),
      noticeTypes: this.noticeTypeService.getAll(),
      users: this.userService.getByApplication(this.applicationId),
    }).subscribe({
      next: ({ notices, noticeTypes, users }) => {
        this.notices.set(notices);
        this.noticeTypes.set(noticeTypes);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los avisos');
        this.loading.set(false);
      },
    });
  }

  protected startCreate(): void {
    this.form.reset({ userId: '', noticeTypeId: '' });
    this.showForm.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { userId, noticeTypeId } = this.form.getRawValue();
    this.noticeService
      .create({ notice: { userId, applicationId: this.applicationId, noticeTypeId } })
      .subscribe({
        next: () => {
          this.toast.success('Aviso registrado');
          this.showForm.set(false);
          this.saving.set(false);
          this.load();
        },
        error: () => {
          this.toast.error('Error al registrar el aviso');
          this.saving.set(false);
        },
      });
  }

  protected onDeleteClick(notice: Notice): void {
    this.deleteTarget.set(notice);
  }

  protected onDeleteConfirmed(): void {
    const notice = this.deleteTarget();
    if (!notice) return;
    this.deleteTarget.set(null);
    this.noticeService.delete(notice.userId, notice.applicationId, notice.noticeTypeId).subscribe({
      next: () => {
        this.toast.success('Aviso revocado');
        this.load();
      },
      error: () => this.toast.error('Error al revocar el aviso'),
    });
  }
}
