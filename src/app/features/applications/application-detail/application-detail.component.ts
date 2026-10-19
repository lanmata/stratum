import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApplicationDirectoryService } from '@core/services/application-directory.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { Application } from '@shared/models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div>
      @if (loading()) {
        <div class="space-y-4" aria-busy="true">
          <div class="skeleton h-32 rounded-2xl"></div>
          <div class="skeleton h-10 w-2/3 rounded-xl"></div>
        </div>
      } @else if (application(); as app) {
        <div class="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
          <div class="flex flex-wrap items-start gap-4 p-5 sm:p-6">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-sm">
              {{ app.name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">{{ app.name }}</h1>
                @if (app.active) {
                  <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Activa</span>
                } @else {
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactiva</span>
                }
              </div>
              @if (app.description) {
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ app.description }}</p>
              }
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Tipo de servicio: {{ loadingServiceType() ? 'cargando…' : (serviceTypeName() ?? '—') }}
              </p>
            </div>
            <a
              [routerLink]="['/applications', app.id, 'edit']"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Editar
            </a>
          </div>

          <nav class="flex gap-1 overflow-x-auto border-t border-gray-100 px-3 dark:border-gray-700" aria-label="Secciones de la aplicación">
            @for (tab of tabs; track tab.path) {
              <a
                [routerLink]="tab.path"
                routerLinkActive
                #rla="routerLinkActive"
                [class]="rla.isActive ? tabActive : tabIdle"
              >
                {{ tab.label }}
              </a>
            }
          </nav>
        </div>

        <router-outlet />
      }
    </div>
  `,
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly directory = inject(ApplicationDirectoryService);
  private readonly serviceTypeService = inject(ServiceTypeService);
  private readonly toast = inject(ToastService);
  private readonly breadcrumbs = inject(BreadcrumbService);

  protected readonly tabs = [
    { path: 'users', label: 'Usuarios' },
    { path: 'roles', label: 'Roles' },
    { path: 'managed-clients', label: 'Clientes M2M' },
    { path: 'notices', label: 'Avisos' },
  ];
  protected readonly tabIdle =
    'whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200';
  protected readonly tabActive =
    'whitespace-nowrap border-b-2 border-blue-600 px-3 py-3 text-sm font-medium text-blue-600 dark:border-blue-400 dark:text-blue-400';

  protected readonly loading = signal(true);
  protected readonly application = signal<Application | null>(null);
  protected readonly loadingServiceType = signal(false);
  protected readonly serviceTypeName = signal<string | null>(null);

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('applicationId')!;
    this.directory.resolve(applicationId).subscribe({
      next: (app) => {
        if (!app) {
          this.toast.error('No se encontró la aplicación solicitada');
          this.router.navigate(['/applications']);
          return;
        }
        this.application.set(app);
        this.breadcrumbs.setLabel(applicationId, app.name);
        this.loading.set(false);
        this.loadServiceType(app.serviceTypeId);
      },
      error: () => {
        this.toast.error('Error al cargar la aplicación');
        this.router.navigate(['/applications']);
      },
    });
  }

  private loadServiceType(serviceTypeId: string | undefined): void {
    if (!serviceTypeId) return;
    this.loadingServiceType.set(true);
    this.serviceTypeService.getById(serviceTypeId).subscribe({
      next: (st) => {
        this.serviceTypeName.set(st.name);
        this.loadingServiceType.set(false);
      },
      error: () => this.loadingServiceType.set(false),
    });
  }
}
