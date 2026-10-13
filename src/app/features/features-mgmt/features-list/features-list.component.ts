import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FeatureService } from '@core/services/feature.service';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { Feature } from '@shared/models/feature.model';
import { Role } from '@shared/models/role.model';
import { parseIds } from '@shared/utils/ids.util';

const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

@Component({
  selector: 'app-features-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Features</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Funcionalidades asignables a roles. Se crean y editan desde el formulario de cada rol.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          [ngModel]="searchName()"
          (ngModelChange)="onSearch($event)"
          placeholder="Buscar por nombre…"
          aria-label="Buscar por nombre"
          [class]="inputClass"
        />

        <select
          [ngModel]="roleFilter()"
          (ngModelChange)="onRoleChange($event)"
          aria-label="Filtrar por rol"
          [class]="inputClass"
        >
          <option value="">Todos los roles</option>
          @for (role of roles(); track role.id) {
            <option [value]="role.id">{{ role.name }}</option>
          }
        </select>

        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            [ngModel]="includeInactive()"
            (ngModelChange)="onIncludeInactiveChange($event)"
            class="h-4 w-4 rounded border-gray-300"
          />
          Incluir inactivas
        </label>

        <form class="flex gap-2" (ngSubmit)="searchByIds()">
          <input
            type="text"
            name="ids"
            [ngModel]="idsInput()"
            (ngModelChange)="idsInput.set($event)"
            placeholder="Filtrar por IDs (separados por coma)…"
            aria-label="Filtrar por IDs"
            [class]="inputClass + ' w-72'"
          />
          <button
            type="submit"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Buscar por IDs
          </button>
        </form>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Id</th>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (feature of paginated(); track feature.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500" [title]="feature.id">{{ feature.id.slice(0, 8) }}…</td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ feature.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ feature.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    @if (feature.active) {
                      <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Activa</span>
                    } @else {
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactiva</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron features</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{{ filtered().length }} features</span>
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
export class FeaturesListComponent implements OnInit {
  private readonly featureService = inject(FeatureService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly pageSize = 10;

  private readonly features = signal<Feature[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchName = signal('');
  protected readonly roleFilter = signal('');
  protected readonly includeInactive = signal(true);
  protected readonly idsInput = signal('');
  protected readonly currentPage = signal(1);

  protected readonly filtered = computed(() => {
    const name = this.searchName().toLowerCase().trim();
    return this.features().filter((f) => !name || f.name.toLowerCase().includes(name));
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  protected readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.roleService.getAll().pipe(catchError(() => of([] as Role[]))).subscribe((roles) =>
      this.roles.set(roles),
    );
    this.reload();
  }

  protected onSearch(value: string): void {
    this.searchName.set(value);
    this.currentPage.set(1);
  }

  protected onRoleChange(roleId: string): void {
    this.roleFilter.set(roleId);
    this.reload();
  }

  protected onIncludeInactiveChange(value: boolean): void {
    this.includeInactive.set(value);
    this.reload();
  }

  protected searchByIds(): void {
    this.reload();
  }

  protected prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  private reload(): void {
    this.loading.set(true);
    const include = this.includeInactive();
    const ids = parseIds(this.idsInput());
    const roleId = this.roleFilter();

    let source$: Observable<Feature[]>;
    if (ids.length > 0) {
      source$ = this.featureService.getByStatusAndIds(include, ids);
    } else if (roleId) {
      source$ = this.featureService
        .getByRole(roleId)
        .pipe(map((list) => (include ? list : list.filter((f) => f.active))));
    } else {
      source$ = this.featureService.getAll(include);
    }

    source$.subscribe({
      next: (list) => {
        this.features.set(list);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar las features');
        this.loading.set(false);
      },
    });
  }
}
