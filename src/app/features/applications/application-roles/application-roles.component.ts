import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationDirectoryService } from '@core/services/application-directory.service';
import { ToastService } from '@core/services/toast.service';
import { Role } from '@shared/models/role.model';

@Component({
  selector: 'app-application-roles',
  standalone: true,
  template: `
    <div class="p-6">
      <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
        Vista de solo lectura — la asignación de roles a una aplicación aún no está soportada por la API.
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando roles…</p>
      } @else if (roles().length === 0) {
        <p class="text-sm text-gray-400 dark:text-gray-500">
          Esta aplicación no tiene roles asignados, o la API aún no expone la relación aplicación-rol.
        </p>
      } @else {
        <div class="space-y-3">
          @for (role of roles(); track role.id) {
            <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800 dark:text-gray-200">{{ role.name }}</span>
                @if (!role.active) {
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    Inactivo
                  </span>
                }
              </div>
              @if (role.description) {
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ role.description }}</p>
              }
              @if ((role.features?.length ?? 0) > 0) {
                <div class="mt-3 flex flex-wrap gap-1">
                  @for (feature of role.features!; track feature.id) {
                    <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {{ feature.name }}
                    </span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ApplicationRolesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly directory = inject(ApplicationDirectoryService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly roles = signal<Role[]>([]);

  ngOnInit(): void {
    const applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;
    this.directory.resolve(applicationId).subscribe({
      next: (app) => {
        if (!app) {
          this.toast.error('No se encontró la aplicación solicitada');
          this.router.navigate(['/applications']);
          return;
        }
        this.roles.set(app.roleList ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los roles de la aplicación');
        this.loading.set(false);
      },
    });
  }
}
