import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleService } from '@core/services/role.service';
import { Role } from '@shared/models/role.model';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Roles</h1>
        </div>
        <a
          routerLink="/roles/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Rol
        </a>
      </div>

      <!-- Filters -->
      <div class="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          [ngModel]="searchName()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar por nombre…"
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
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (role of paginated(); track role.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ role.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ role.description }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="role.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
                    >
                      {{ role.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <a
                      [routerLink]="['/roles', role.id, 'edit']"
                      class="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Editar
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron roles</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{{ firstItem() }}–{{ lastItem() }} de {{ filtered().length }} roles</span>
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
  `,
})
export class RolesListComponent implements OnInit {
  private readonly roleService = inject(RoleService);

  protected readonly loading = signal(true);
  private readonly allRoles = signal<Role[]>([]);

  protected readonly searchName = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(1);

  protected readonly filtered = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    const status = this.statusFilter();
    return this.allRoles().filter((r) => {
      const matchesName = !name || r.name.toLowerCase().includes(name);
      const matchesStatus =
        status === 'all' || (status === 'active' ? r.active : !r.active);
      return matchesName && matchesStatus;
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
    this.roleService.getAll().subscribe({
      next: (data) => {
        this.allRoles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onSearch(value: string): void {
    this.searchName.set(value);
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
