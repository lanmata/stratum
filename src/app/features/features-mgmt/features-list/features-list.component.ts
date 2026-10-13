import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FeatureService } from '@core/services/feature.service';
import { ToastService } from '@core/services/toast.service';
import { FeatureRoleLink, FeatureSummary } from '@shared/models/feature.model';
import { emptyPage, Page } from '@shared/models/page.model';

const PAGE_SIZE = 10;
const ROLES_PAGE_SIZE = 10;
const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

const INPUT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';
const PAGER_BUTTON_CLASS =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700';

type StatusFilter = '' | 'true' | 'false';

@Component({
  selector: 'app-features-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Features</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consulta de funcionalidades. El catálogo puede ser muy grande, por eso no se lista completo:
          busca una funcionalidad para saber a qué roles (y aplicaciones) está vinculada. Las
          funcionalidades se crean y vinculan desde el formulario de cada rol.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          [ngModel]="query()"
          (ngModelChange)="onQuery($event)"
          placeholder="Buscar por nombre o descripción…"
          aria-label="Buscar funcionalidad"
          [class]="inputClass + ' w-80'"
        />
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
      </div>

      @if (!searched()) {
        <p class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Escribe al menos {{ minQueryLength }} caracteres para buscar una funcionalidad.
        </p>
      } @else if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Descripción</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (feature of results().content; track feature.id) {
                <tr
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  [class.bg-blue-50]="selected()?.id === feature.id"
                >
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ feature.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ feature.description ?? '—' }}</td>
                  <td class="px-4 py-3">
                    @if (feature.active) {
                      <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Activa</span>
                    } @else {
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactiva</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      (click)="showRoles(feature)"
                      class="rounded-lg border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      Ver roles
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron funcionalidades</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{{ results().totalElements }} funcionalidades</span>
          @if (results().totalPages > 1) {
            <div class="flex items-center gap-2">
              <button type="button" (click)="goToResults(results().page - 1)" [disabled]="results().page === 0" [class]="pagerButtonClass">← Anterior</button>
              <span class="px-2">Página {{ results().page + 1 }} de {{ results().totalPages }}</span>
              <button type="button" (click)="goToResults(results().page + 1)" [disabled]="results().page + 1 >= results().totalPages" [class]="pagerButtonClass">Siguiente →</button>
            </div>
          }
        </div>
      }

      @if (selected(); as feature) {
        <section class="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Roles vinculados">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Roles que usan «{{ feature.name }}»
            </h2>
            <button
              type="button"
              (click)="closeRoles()"
              class="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cerrar
            </button>
          </div>

          @if (rolesLoading()) {
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando roles…</p>
          } @else {
            <ul class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (link of roles().content; track link.roleId) {
                <li class="flex items-center justify-between py-2 text-sm">
                  <span class="text-gray-800 dark:text-gray-200">
                    {{ link.roleName }}
                    @if (!link.roleActive) {
                      <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">Inactivo</span>
                    }
                  </span>
                  <a
                    [routerLink]="['/applications', link.applicationId, 'roles', link.roleId, 'edit']"
                    class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {{ link.applicationName }}
                  </a>
                </li>
              } @empty {
                <li class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                  Esta funcionalidad no está vinculada a ningún rol.
                </li>
              }
            </ul>
            @if (roles().totalPages > 1) {
              <div class="mt-3 flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-400">
                <button type="button" (click)="goToRoles(roles().page - 1)" [disabled]="roles().page === 0" [class]="pagerButtonClass">← Anterior</button>
                <span class="px-2">Página {{ roles().page + 1 }} de {{ roles().totalPages }}</span>
                <button type="button" (click)="goToRoles(roles().page + 1)" [disabled]="roles().page + 1 >= roles().totalPages" [class]="pagerButtonClass">Siguiente →</button>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class FeaturesListComponent {
  private readonly featureService = inject(FeatureService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly query$ = new Subject<string>();

  protected readonly inputClass = INPUT_CLASS;
  protected readonly pagerButtonClass = PAGER_BUTTON_CLASS;
  protected readonly minQueryLength = MIN_QUERY_LENGTH;

  protected readonly query = signal('');
  protected readonly statusFilter = signal<StatusFilter>('');
  protected readonly searched = signal(false);
  protected readonly loading = signal(false);
  protected readonly results = signal<Page<FeatureSummary>>(emptyPage(PAGE_SIZE));
  protected readonly selected = signal<FeatureSummary | null>(null);
  protected readonly rolesLoading = signal(false);
  protected readonly roles = signal<Page<FeatureRoleLink>>(emptyPage(ROLES_PAGE_SIZE));

  constructor() {
    this.query$
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.runSearch(0));
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.query$.next(value.trim());
  }

  protected onStatusChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.runSearch(0);
  }

  protected goToResults(page: number): void {
    if (page < 0 || page >= this.results().totalPages) return;
    this.runSearch(page);
  }

  protected showRoles(feature: FeatureSummary): void {
    this.selected.set(feature);
    this.loadRoles(0);
  }

  protected closeRoles(): void {
    this.selected.set(null);
  }

  protected goToRoles(page: number): void {
    if (page < 0 || page >= this.roles().totalPages) return;
    this.loadRoles(page);
  }

  private runSearch(page: number): void {
    const q = this.query().trim();
    if (q.length < MIN_QUERY_LENGTH) {
      this.searched.set(false);
      this.selected.set(null);
      this.results.set(emptyPage(PAGE_SIZE));
      return;
    }
    this.searched.set(true);
    this.loading.set(true);
    const status = this.statusFilter();
    this.featureService
      .search({ q, active: status === '' ? undefined : status === 'true', page, size: PAGE_SIZE })
      .subscribe({
        next: (result) => {
          this.results.set(result);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error al buscar las funcionalidades');
          this.loading.set(false);
        },
      });
  }

  private loadRoles(page: number): void {
    const feature = this.selected();
    if (!feature) return;
    this.rolesLoading.set(true);
    this.featureService.getRoles(feature.id, page, ROLES_PAGE_SIZE).subscribe({
      next: (result) => {
        this.roles.set(result);
        this.rolesLoading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los roles de la funcionalidad');
        this.rolesLoading.set(false);
      },
    });
  }
}
