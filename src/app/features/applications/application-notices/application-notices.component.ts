import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NoticeService } from '@core/services/notice.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { Notice } from '@shared/models/notice.model';
import { NoticeType } from '@shared/models/notice-type.model';
import { UserTO } from '@shared/models/user.model';

@Component({
  selector: 'app-application-notices',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando avisos…</p>
      } @else {
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Nuevo Aviso
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
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tipo de aviso</label>
              <select
                formControlName="noticeTypeId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">— Seleccionar tipo —</option>
                @for (nt of noticeTypes(); track nt.id) {
                  <option [value]="nt.id">{{ nt.name }}</option>
                }
              </select>
            </div>
            <button
              type="submit"
              [disabled]="form.invalid || saving()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Creando…' : 'Crear aviso' }}
            </button>
          </form>
        </div>

        @if (notices().length === 0) {
          <p class="text-sm text-gray-400 dark:text-gray-500">Esta aplicación no tiene avisos registrados.</p>
        } @else {
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-3">Usuario</th>
                  <th class="px-4 py-3">Tipo</th>
                  <th class="px-4 py-3">Creado</th>
                  <th class="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (notice of notices(); track notice.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ userLabel(notice.userId) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ noticeTypeLabel(notice.noticeTypeId) }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ notice.createdAt ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        title="Eliminar"
                        (click)="onDeleteClick(notice)"
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
        message="¿Eliminar este aviso? Esta acción no se puede deshacer."
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class ApplicationNoticesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly noticeService = inject(NoticeService);
  private readonly noticeTypeService = inject(NoticeTypeService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  private readonly applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly notices = signal<Notice[]>([]);
  protected readonly noticeTypes = signal<NoticeType[]>([]);
  protected readonly users = signal<UserTO[]>([]);
  protected readonly showConfirm = signal(false);
  private readonly pendingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    noticeTypeId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  protected userLabel(userId: string): string {
    const u = this.users().find((x) => x.id === userId);
    return u ? `${u.displayName} (${u.alias})` : userId;
  }

  protected noticeTypeLabel(noticeTypeId: string): string {
    return this.noticeTypes().find((nt) => nt.id === noticeTypeId)?.name ?? noticeTypeId;
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { userId, noticeTypeId } = this.form.getRawValue();
    this.noticeService
      .create({
        notice: {
          id: '',
          userId,
          applicationId: this.applicationId,
          noticeTypeId,
        },
      })
      .subscribe({
        next: (notice) => {
          this.notices.update((list) => [notice, ...list]);
          this.form.reset({ userId: '', noticeTypeId: '' });
          this.toast.success('Aviso creado');
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Error al crear el aviso');
          this.saving.set(false);
        },
      });
  }

  protected onDeleteClick(notice: Notice): void {
    this.pendingId.set(notice.id);
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    const id = this.pendingId();
    if (!id) return;
    this.showConfirm.set(false);
    this.noticeService.delete(id).subscribe({
      next: () => {
        this.notices.update((list) => list.filter((n) => n.id !== id));
        this.toast.success('Aviso eliminado');
      },
      error: () => this.toast.error('Error al eliminar el aviso'),
    });
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
        this.noticeTypes.set(noticeTypes.filter((nt) => nt.active));
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los avisos');
        this.loading.set(false);
      },
    });
  }
}
