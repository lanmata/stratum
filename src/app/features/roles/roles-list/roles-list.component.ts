import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleService } from '@core/services/role.service';
import { Role } from '@shared/models/role.model';
import { parseIds } from '@shared/utils/ids.util';

type StatusFilter = 'all' | 'active' | 'inactive';

function intersectById(candidates: Role[], owned: Role[]): Role[] {
  const ownedIds = new Set(owned.map((r) => r.id));
  return candidates.filter((r) => ownedIds.has(r.id));
}

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Roles</h1>
        </div>
        <a
          [routerLink]="['/applications', applicationId, 'roles', 'new']"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo Rol
        </a>
      </div>

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

        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            [ngModel]="includeInactive()"
            (ngModelChange)="onIncludeInactiveChange($event)"
            class="h-4 w-4 rounded border-gray-300"
          />
          Incluir inactivos
        </label>

        <form class="flex gap-2" (ngSubmit)="searchByIds()">
          <input
            type="text"
            name="ids"
            [ngModel]="idsInput()"
            (ngModelChange)="idsInput.set($event)"
            placeholder="Filtrar por IDs (separados por coma)…"
            aria-label="Filtrar por IDs"
            class="w-72 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Buscar por IDs
          </button>
        </form>

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
                <th class="w-8 px-3 py-3"></th>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (role of paginated(); track role.id) {
                <!-- Role row -->
                <tr
                  class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  (click)="toggleExpand(role.id)"
                >
                  <td class="px-3 py-3 text-center text-gray-400 dark:text-gray-500">
                    @let hasFeatures = (role.features?.length ?? 0) > 0;
                    @if (hasFeatures) {
                      <svg
                        class="inline-block h-4 w-4 transition-transform"
                        [class.rotate-90]="expandedIds().has(role.id)"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    } @else {
                      <span class="text-xs text-gray-300 dark:text-gray-600">—</span>
                    }
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {{ role.name }}
                    @if ((role.features?.length ?? 0) > 0) {
                      <span class="ml-2 rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {{ role.features!.length }}
                      </span>
                    }
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ role.description }}</td>
                  <td class="px-4 py-3">
                    @if (role.active) {
                      <svg title="Activo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg title="Inactivo" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    }
                  </td>
                  <td class="px-4 py-3" (click)="$event.stopPropagation()">
                    <div class="flex items-center gap-1">
                      <a
                        [routerLink]="['/applications', applicationId, 'roles', role.id, 'edit']"
                        title="Editar"
                        class="inline-flex rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Feature child rows (tree) -->
                @if (expandedIds().has(role.id) && (role.features?.length ?? 0) > 0) {
                  @for (feature of role.features!; track feature.id; let last = $last) {
                    <tr class="bg-gray-50/60 dark:bg-gray-700/20">
                      <td class="px-3 py-2"></td>
                      <td class="py-2 pl-8 pr-4" colspan="1">
                        <div class="flex items-center gap-2">
                          <!-- Tree connector -->
                          <span class="flex flex-col items-center self-stretch">
                            <span class="w-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
                            <span class="mt-0 h-px w-3 bg-gray-300 dark:bg-gray-600"></span>
                            @if (!last) {
                              <span class="w-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
                            } @else {
                              <span class="w-px flex-1"></span>
                            }
                          </span>
                          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ feature.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{{ feature.description ?? '—' }}</td>
                      <td class="px-4 py-2">
                        @if (feature.active) {
                          <svg title="Activa" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                        } @else {
                          <svg title="Inactiva" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                          </svg>
                        }
                      </td>
                      <td class="px-4 py-2"></td>
                    </tr>
                  }
                }
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron roles</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

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
  private readonly route = inject(ActivatedRoute);

  protected readonly applicationId = this.route.snapshot.paramMap.get('applicationId')!;
  protected readonly loading = signal(true);
  private readonly allRoles = signal<Role[]>([]);
  protected readonly expandedIds = signal<Set<string>>(new Set());

  protected readonly includeInactive = signal(true);
  protected readonly idsInput = signal('');
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
    this.reload();
  }

  protected onIncludeInactiveChange(value: boolean): void {
    this.includeInactive.set(value);
    this.reload();
  }

  protected searchByIds(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    const ids = parseIds(this.idsInput());
    const include = this.includeInactive();

    // Role payloads carry no applicationId, so the status/ids endpoints (which span every
    // application) are narrowed to the roles that belong to this application.
    const applicationRoles$ = this.roleService.getByApplication(this.applicationId);
    let source$: Observable<Role[]>;
    if (ids.length > 0) {
      source$ = forkJoin([applicationRoles$, this.roleService.getByStatusAndIds(include, ids)]).pipe(
        map(([own, matched]) => intersectById(matched, own)),
      );
    } else if (include) {
      source$ = applicationRoles$;
    } else {
      source$ = forkJoin([applicationRoles$, this.roleService.getByStatus(false)]).pipe(
        map(([own, active]) => intersectById(active, own)),
      );
    }

    source$.subscribe({
      next: (roles) => {
        this.allRoles.set(roles);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected toggleExpand(roleId: string): void {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
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
