import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { UserTO } from '@shared/models/user.model';
import { API } from '@shared/constants/api.constants';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Usuarios</h1>
        </div>
        <a
          routerLink="/users/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Usuario
        </a>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          [ngModel]="searchAlias()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar por alias o nombre…"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <select
          [ngModel]="pageSize()"
          (ngModelChange)="onPageSizeChange($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option [ngValue]="10">10 por página</option>
          <option [ngValue]="25">25 por página</option>
          <option [ngValue]="50">50 por página</option>
        </select>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Alias</th>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Roles</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (user of paginated(); track user.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{{ user.alias }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ user.displayName }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ user.email }}</td>
                  <td class="px-4 py-3">
                    @if ((user.roles?.length ?? 0) > 0) {
                      <div class="flex flex-wrap gap-1">
                        @for (role of user.roles!; track role.id) {
                          <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {{ role.name }}
                          </span>
                        }
                      </div>
                    } @else {
                      <span class="text-gray-400 dark:text-gray-500">—</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (user.active) {
                      <svg title="Activo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg title="Inactivo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <a
                        [routerLink]="['/users', user.id, 'edit']"
                        title="Editar"
                        class="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </a>
                      <button
                        type="button"
                        title="Eliminar"
                        (click)="deleteTarget.set(user)"
                        class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{{ firstItem() }}–{{ lastItem() }} de {{ filtered().length }} usuarios</span>
            <div class="flex items-center gap-2">
              <button
                (click)="prevPage()"
                [disabled]="currentPage() === 1"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ← Anterior
              </button>
              <span class="px-2">Página {{ currentPage() }} de {{ totalPages() }}</span>
              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages()"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Siguiente →
              </button>
            </div>
          </div>
        }
      }
    </div>

    @if (deleteTarget()) {
      <app-confirm-dialog
        title="Eliminar usuario"
        [message]="deleteMessage()"
        confirmLabel="Eliminar"
        confirmStyle="danger"
        (confirmed)="confirmDelete()"
        (cancelled)="deleteTarget.set(null)"
      />
    }
  `,
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly appId = API.APPLICATION.ID;

  protected readonly loading = signal(true);
  private readonly allUsers = signal<UserTO[]>([]);
  protected readonly deleteTarget = signal<UserTO | null>(null);

  protected readonly searchAlias = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(1);

  protected readonly deleteMessage = computed(() => {
    const u = this.deleteTarget();
    return u
      ? `¿Eliminar al usuario "${u.alias}"? Esta acción no se puede deshacer y eliminará todos sus datos asociados.`
      : '';
  });

  protected readonly filtered = computed(() => {
    const query = this.searchAlias().toLowerCase().trim();
    const status = this.statusFilter();
    return this.allUsers().filter((u) => {
      const matchesQuery =
        !query ||
        u.alias.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query);
      const matchesStatus =
        status === 'all' || (status === 'active' ? u.active : !u.active);
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );

  protected readonly paginated = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    return this.filtered().slice((page - 1) * size, page * size);
  });

  protected readonly firstItem = computed(() =>
    this.filtered().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1
  );

  protected readonly lastItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.filtered().length)
  );

  ngOnInit(): void {
    this.userService.getByApplication(this.appId).subscribe({
      next: (data) => {
        this.allUsers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los usuarios');
        this.loading.set(false);
      },
    });
  }

  protected confirmDelete(): void {
    const user = this.deleteTarget();
    if (!user) return;
    this.userService.delete(this.appId, user.id).subscribe({
      next: () => {
        this.allUsers.update((list) => list.filter((u) => u.id !== user.id));
        this.deleteTarget.set(null);
        this.toast.success(`Usuario "${user.alias}" eliminado correctamente`);
      },
      error: () => {
        this.toast.error('Error al eliminar el usuario');
        this.deleteTarget.set(null);
      },
    });
  }

  protected onSearch(value: string): void {
    this.searchAlias.set(value);
    this.currentPage.set(1);
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  protected onPageSizeChange(value: number): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  protected prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }
}
