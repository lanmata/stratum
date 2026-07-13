import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApplicationDirectoryService } from '@core/services/application-directory.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      @if (loading()) {
        <p class="p-6 text-sm text-gray-500 dark:text-gray-400">Cargando aplicación…</p>
      } @else if (application(); as app) {
        <div class="border-b border-gray-200 bg-white px-6 py-6 dark:border-gray-700 dark:bg-gray-800">
          <a routerLink="/applications" class="text-sm text-blue-600 hover:underline">← Aplicaciones</a>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ app.name }}</h1>
            @if (app.active) {
              <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Activa
              </span>
            } @else {
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                Inactiva
              </span>
            }
          </div>
          @if (app.description) {
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ app.description }}</p>
          }
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Tipo de servicio: {{ loadingServiceType() ? 'cargando…' : (serviceTypeName() ?? '—') }}
          </p>

          <nav class="mt-5 flex gap-1">
            <a
              routerLink="users"
              routerLinkActive="border-blue-600 text-blue-600 dark:text-blue-400"
              [routerLinkActiveOptions]="{ exact: false }"
              class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Usuarios
            </a>
            <a
              routerLink="roles"
              routerLinkActive="border-blue-600 text-blue-600 dark:text-blue-400"
              [routerLinkActiveOptions]="{ exact: false }"
              class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Roles
            </a>
            <a
              routerLink="assignments"
              routerLinkActive="border-blue-600 text-blue-600 dark:text-blue-400"
              [routerLinkActiveOptions]="{ exact: false }"
              class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Asignaciones
            </a>
            <a
              routerLink="notices"
              routerLinkActive="border-blue-600 text-blue-600 dark:text-blue-400"
              [routerLinkActiveOptions]="{ exact: false }"
              class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Avisos
            </a>
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
