import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FeatureService } from '@core/services/feature.service';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { FeatureRoleLink, FeatureSummary } from '@shared/models/feature.model';
import { Role } from '@shared/models/role.model';
import { parseIds } from '@shared/utils/ids.util';

type StatusFilter = '' | 'true' | 'false';

const PAGE_SIZE = 20;
const ROLES_PAGE_SIZE = 10;
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
          Catálogo de funcionalidades, paginado en el servidor. Se crean y editan desde el formulario de cada rol; aquí
          puedes ver qué roles (y aplicaciones) usa cada una.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <form class="flex gap-2" (ngSubmit)="applyText()">
          <input
            type="text"
            name="q"
            [ngModel]="searchInput()"
            (ngModelChange)="searchInput.set($event)"
            placeholder="Buscar por nombre o descripción…"
            aria-label="Buscar por nombre"
            [class]="inputClass + ' w-72'"
          />
          <button
            type="submit"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>

        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          aria-label="Filtrar por estado"
          [class]="inputClass"
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>

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
                <th class="px-4 py-3">Roles</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (feature of features(); track feature.id) {
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
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      (click)="toggleRoles(feature)"
                      [attr.aria-expanded]="expandedId() === feature.id"
                      class="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {{ expandedId() === feature.id ? 'Ocultar roles' : 'Ver roles' }}
                    </button>
                  </td>
                </tr>
                @if (expandedId() === feature.id) {
                  <tr class="bg-gray-50/60 dark:bg-gray-700/20">
                    <td colspan="5" class="px-4 py-3">
                      @if (rolesLoading()) {
                        <p class="text-xs text-gray-500 dark:text-gray-400">Cargando roles…</p>
                      } @else if (roleLinks().length === 0) {
                        <p class="text-xs text-gray-500 dark:text-gray-400">Ningún rol usa esta feature.</p>
                      } @else {
                        <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          @for (link of roleLinks(); track link.roleId) {
                            <li>
                              <span class="font-medium">{{ link.roleName }}</span>
                              <span class="text-gray-500 dark:text-gray-400"> · {{ link.applicationName }}</span>
                              @if (!link.roleActive) {
                                <span class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
                              }
                            </li>
                          }
                        </ul>
                        @if (rolesTotalPages() > 1) {
                          <div class="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <button type="button" (click)="goToRoles(rolesPage() - 1)" [disabled]="rolesPage() === 0" class="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-40 dark:border-gray-600">Roles anteriores</button>
                            <span>{{ rolesPage() + 1 }} / {{ rolesTotalPages() }}</span>
                            <button type="button" (click)="goToRoles(rolesPage() + 1)" [disabled]="rolesPage() + 1 >= rolesTotalPages()" class="rounded border border-gray-300 px-2 py-0.5 disabled:opacity-40 dark:border-gray-600">Roles siguientes</button>
                          </div>
                        }
                      }
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron features</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ total() }} features</span>
          @if (totalPages() > 1) {
            <div class="flex items-center gap-2">
              <button
                (click)="goTo(page() - 1)"
                [disabled]="page() === 0"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                ← Anterior
              </button>
              <span class="px-2">Página {{ page() + 1 }} de {{ totalPages() }}</span>
              <button
                (click)="goTo(page() + 1)"
                [disabled]="page() + 1 >= totalPages()"
                class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Siguiente →
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class FeaturesListComponent implements OnInit {
  private readonly featureService = inject(FeatureService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly inputClass = INPUT_CLASS;

  protected readonly features = signal<FeatureSummary[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchInput = signal('');
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly roleFilter = signal('');
  protected readonly idsInput = signal('');

  protected readonly page = signal(0);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);

  protected readonly expandedId = signal<string | null>(null);
  protected readonly roleLinks = signal<FeatureRoleLink[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly rolesPage = signal(0);
  protected readonly rolesTotalPages = signal(1);

  private readonly appliedText = signal('');

  ngOnInit(): void {
    this.roleService.getAll().pipe(catchError(() => of([] as Role[]))).subscribe((roles) =>
      this.roles.set(roles),
    );
    this.reload();
  }

  protected applyText(): void {
    this.appliedText.set(this.searchInput().trim());
    this.reload();
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.reload();
  }

  protected onRoleChange(roleId: string): void {
    this.roleFilter.set(roleId);
    this.reload();
  }

  protected searchByIds(): void {
    this.reload();
  }

  protected goTo(page: number): void {
    this.loadCatalog(Math.min(Math.max(0, page), this.totalPages() - 1));
  }

  protected toggleRoles(feature: FeatureSummary): void {
    if (this.expandedId() === feature.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(feature.id);
    this.loadRoles(feature.id, 0);
  }

  protected goToRoles(page: number): void {
    const id = this.expandedId();
    if (id) this.loadRoles(id, Math.min(Math.max(0, page), this.rolesTotalPages() - 1));
  }

  private loadRoles(featureId: string, page: number): void {
    this.rolesLoading.set(true);
    this.featureService.getRoles(featureId, page, ROLES_PAGE_SIZE).subscribe({
      next: (res) => {
        this.roleLinks.set(res.content);
        this.rolesPage.set(res.page);
        this.rolesTotalPages.set(Math.max(1, res.totalPages));
        this.rolesLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los roles de la feature');
        this.roleLinks.set([]);
        this.rolesLoading.set(false);
      },
    });
  }

  private reload(): void {
    this.expandedId.set(null);
    const ids = parseIds(this.idsInput());
    const roleId = this.roleFilter();
    const status = this.statusFilter();
    const text = this.appliedText().toLowerCase();
    const matches = (f: FeatureSummary) =>
      (status === '' || f.active === (status === 'true')) &&
      (!text || f.name.toLowerCase().includes(text) || (f.description ?? '').toLowerCase().includes(text));

    // Lookups by ids or by role are bounded by the caller, so they come back whole; only the
    // catalog search is paged on the server.
    let bounded$: Observable<FeatureSummary[]> | null = null;
    if (ids.length > 0) {
      bounded$ = this.featureService.getByStatusAndIds(true, ids);
    } else if (roleId) {
      bounded$ = this.featureService.getByRole(roleId);
    }

    if (!bounded$) {
      this.loadCatalog(0);
      return;
    }
    this.loading.set(true);
    bounded$.pipe(map((list) => list.filter(matches))).subscribe({
      next: (list) => {
        this.features.set(list);
        this.page.set(0);
        this.total.set(list.length);
        this.totalPages.set(1);
        this.loading.set(false);
      },
      error: () => this.failed(),
    });
  }

  private loadCatalog(page: number): void {
    const status = this.statusFilter();
    this.loading.set(true);
    this.featureService
      .search({
        page,
        size: PAGE_SIZE,
        ...(this.appliedText() ? { q: this.appliedText() } : {}),
        ...(status ? { active: status === 'true' } : {}),
      })
      .subscribe({
        next: (res) => {
          this.features.set(res.content);
          this.page.set(res.page);
          this.total.set(res.totalElements);
          this.totalPages.set(Math.max(1, res.totalPages));
          this.expandedId.set(null);
          this.loading.set(false);
        },
        error: () => this.failed(),
      });
  }

  private failed(): void {
    this.toast.error('Error al cargar las features');
    this.loading.set(false);
  }
}
