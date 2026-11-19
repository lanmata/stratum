import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicationService } from '@core/services/application.service';
import { FederationService } from '@core/services/federation.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { Application } from '@shared/models/application.model';
import {
  FEDERATION_PROVIDER_NAMES,
  IdentityProvider,
  IdentityProviderRequest,
} from '@shared/models/federation.model';

/** Una línea por URI (o una lista separada por comas); las líneas vacías se descartan. */
export function splitList(value: string | null | undefined, separator: RegExp): string[] {
  return (value ?? '')
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/**
 * Federación: los proveedores de acceso social (Google, Microsoft, Apple, GitHub, Meta) de cada aplicación. El secreto del
 * cliente nunca pasa por aquí: se guarda en Vault y el ajuste solo lleva la **referencia** (el nombre de la variable que lo
 * contiene). Quitar un proveedor o apagarlo no afecta al acceso por contraseña.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-providers-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Federación</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Proveedores de acceso social por aplicación. El secreto del cliente vive en Vault: aquí solo va su referencia.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <label for="fed-application" class="text-sm font-medium text-gray-700 dark:text-gray-300">Aplicación</label>
        <select id="fed-application" [ngModel]="applicationId()" (ngModelChange)="selectApplication($event)"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
          <option value="">— elige una aplicación —</option>
          @for (application of applications(); track application.id) {
            <option [value]="application.id">{{ application.name }}</option>
          }
        </select>
        @if (applicationId()) {
          <button type="button" data-testid="new" (click)="startCreate()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Configurar proveedor</button>
        }
      </div>

      @if (problem(); as text) {
        <p role="alert" data-testid="problem" class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{{ text }}</p>
      }

      @if (applicationId()) {
        @if (loading()) {
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
        } @else {
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-3">Proveedor</th>
                  <th class="px-4 py-3">Client ID</th>
                  <th class="px-4 py-3">Referencia del secreto</th>
                  <th class="px-4 py-3">Dominios</th>
                  <th class="px-4 py-3">Activo</th>
                  <th class="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (provider of providers(); track provider.id) {
                  <tr [attr.data-provider-row]="provider.provider">
                    <td class="px-4 py-3 font-medium capitalize text-gray-800 dark:text-gray-200">{{ provider.provider }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ provider.clientId }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ provider.clientSecretRef }}</td>
                    <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ provider.allowedEmailDomains.join(', ') || 'cualquiera' }}</td>
                    <td class="px-4 py-3">
                      <label class="inline-flex items-center gap-2">
                        <input type="checkbox" [checked]="provider.enabled" [attr.aria-label]="'Activar ' + provider.provider"
                          (change)="toggle(provider)" />
                        <span class="text-xs text-gray-500">{{ provider.enabled ? 'Sí' : 'No' }}</span>
                      </label>
                    </td>
                    <td class="px-4 py-3">
                      <button type="button" data-action="edit" (click)="startEdit(provider)" class="mr-2 text-blue-600 hover:underline dark:text-blue-400">Editar</button>
                      <button type="button" data-action="delete" (click)="askDelete(provider)" class="text-red-600 hover:underline dark:text-red-400">Quitar</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Esta aplicación no ofrece proveedores</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      @if (editing()) {
        <form [formGroup]="form" (ngSubmit)="save()" data-testid="form"
          class="mt-6 max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ editingId() ? 'Editar proveedor' : 'Configurar proveedor' }}</h2>

          <div>
            <label for="fed-provider" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
            <select id="fed-provider" formControlName="provider"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
              @for (name of names; track name) {
                <option [value]="name">{{ name }}</option>
              }
            </select>
          </div>
          <div>
            <label for="fed-client-id" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client ID</label>
            <input id="fed-client-id" formControlName="clientId" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div>
            <label for="fed-secret-ref" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia del secreto</label>
            <input id="fed-secret-ref" formControlName="clientSecretRef" placeholder="FEDERATION_GOOGLE_IRIS_SECRET"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            <p class="mt-1 text-xs text-gray-500">Nombre de la variable de entorno (Vault) con el secreto. Nunca el secreto.</p>
          </div>
          <div>
            <label for="fed-redirects" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">URIs de retorno (una por línea)</label>
            <textarea id="fed-redirects" formControlName="redirectUris" rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"></textarea>
            <p class="mt-1 text-xs text-gray-500">Exactas y con HTTPS, una por entorno: https://&lt;host&gt;/bff/federation/callback</p>
          </div>
          <div>
            <label for="fed-domains" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Dominios de correo permitidos (separados por comas; vacío = cualquiera)</label>
            <input id="fed-domains" formControlName="allowedEmailDomains" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div class="flex flex-wrap gap-6">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" formControlName="trustedEmail" /> Confiar en el correo verificado (enlace automático)
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" formControlName="enabled" /> Activo
            </label>
          </div>
          <div class="flex gap-3">
            <button type="submit" [disabled]="form.invalid || saving()" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {{ saving() ? 'Guardando…' : 'Guardar' }}
            </button>
            <button type="button" data-testid="cancel" (click)="cancel()" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">Cancelar</button>
          </div>
        </form>
      }
    </div>

    @if (pendingDelete(); as target) {
      <app-confirm-dialog
        [message]="'¿Quitar ' + target.provider + ' de esta aplicación? Se rechaza si hay usuarios enlazados.'"
        (confirmed)="confirmDelete()"
        (cancelled)="pendingDelete.set(null)"
      />
    }
  `,
})
export class ProvidersPageComponent implements OnInit {
  private readonly federation = inject(FederationService);
  private readonly applicationService = inject(ApplicationService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly names = FEDERATION_PROVIDER_NAMES;
  protected readonly applications = signal<Application[]>([]);
  protected readonly applicationId = signal('');
  protected readonly providers = signal<IdentityProvider[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly problem = signal<string | null>(null);
  protected readonly editing = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly pendingDelete = signal<IdentityProvider | null>(null);
  protected readonly hasProviders = computed(() => this.providers().length > 0);

  protected readonly form = this.fb.nonNullable.group({
    provider: ['google', Validators.required],
    clientId: ['', Validators.required],
    clientSecretRef: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_.:\-/]+$/)]],
    redirectUris: ['', Validators.required],
    allowedEmailDomains: [''],
    trustedEmail: [true],
    enabled: [false],
  });

  ngOnInit(): void {
    this.applicationService.getAll().subscribe({
      next: (applications) => this.applications.set(applications),
      error: () => this.problem.set('No pudimos cargar las aplicaciones.'),
    });
  }

  protected selectApplication(id: string): void {
    this.applicationId.set(id);
    this.editing.set(false);
    this.problem.set(null);
    if (id) this.reload();
    else this.providers.set([]);
  }

  private reload(): void {
    this.loading.set(true);
    this.federation.listProviders(this.applicationId()).subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.providers.set([]);
        this.loading.set(false);
        this.problem.set(error.status === 403 ? 'No tienes permiso (FEDERATION_ADMIN) para ver los proveedores.' : 'No pudimos cargar los proveedores.');
      },
    });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ provider: 'google', clientId: '', clientSecretRef: '', redirectUris: '', allowedEmailDomains: '', trustedEmail: true, enabled: false });
    this.form.controls.provider.enable();
    this.editing.set(true);
  }

  protected startEdit(provider: IdentityProvider): void {
    this.editingId.set(provider.id);
    this.form.reset({
      provider: provider.provider,
      clientId: provider.clientId,
      clientSecretRef: provider.clientSecretRef,
      redirectUris: provider.redirectUris.join('\n'),
      allowedEmailDomains: provider.allowedEmailDomains.join(', '),
      trustedEmail: provider.trustedEmail,
      enabled: provider.enabled,
    });
    this.form.controls.provider.disable();
    this.editing.set(true);
  }

  protected cancel(): void {
    this.editing.set(false);
  }

  private request(provider: IdentityProvider | null = null): IdentityProviderRequest {
    const value = this.form.getRawValue();
    return {
      applicationId: this.applicationId(),
      provider: provider?.provider ?? value.provider,
      clientId: value.clientId.trim(),
      clientSecretRef: value.clientSecretRef.trim(),
      issuer: provider?.issuer ?? null,
      scopes: provider?.scopes ?? null,
      redirectUris: splitList(value.redirectUris, /\r?\n/),
      allowedEmailDomains: splitList(value.allowedEmailDomains, /[,\s]+/),
      trustedEmail: value.trustedEmail,
      enabled: value.enabled,
    };
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.problem.set(null);
    const id = this.editingId();
    const current = id ? (this.providers().find((p) => p.id === id) ?? null) : null;
    const request = this.request(current);
    const call$ = id ? this.federation.updateProvider(id, request) : this.federation.createProvider(request);
    call$.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success('Proveedor guardado');
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.problem.set(this.messageFor(error));
      },
    });
  }

  /** Enciende o apaga un proveedor sin tocar el resto del ajuste. */
  protected toggle(provider: IdentityProvider): void {
    const request: IdentityProviderRequest = {
      applicationId: provider.applicationId,
      provider: provider.provider,
      clientId: provider.clientId,
      clientSecretRef: provider.clientSecretRef,
      issuer: provider.issuer ?? null,
      scopes: provider.scopes ?? null,
      redirectUris: provider.redirectUris,
      allowedEmailDomains: provider.allowedEmailDomains,
      trustedEmail: provider.trustedEmail,
      enabled: !provider.enabled,
    };
    this.federation.updateProvider(provider.id, request).subscribe({
      next: () => this.reload(),
      error: (error: HttpErrorResponse) => {
        this.problem.set(this.messageFor(error));
        this.reload();
      },
    });
  }

  protected askDelete(provider: IdentityProvider): void {
    this.pendingDelete.set(provider);
  }

  protected confirmDelete(): void {
    const target = this.pendingDelete();
    this.pendingDelete.set(null);
    if (!target) return;
    this.federation.deleteProvider(target.id).subscribe({
      next: () => {
        this.toast.success('Proveedor quitado');
        this.reload();
      },
      error: (error: HttpErrorResponse) =>
        this.problem.set(error.status === 409 ? 'Hay usuarios enlazados con este proveedor: desenlázalos antes de quitarlo.' : this.messageFor(error)),
    });
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 403) return 'No tienes permiso (FEDERATION_ADMIN) para cambiar los proveedores.';
    if (error.status === 409) return 'Ese proveedor ya está configurado para la aplicación.';
    if (error.status === 400) return 'El ajuste no es válido: revisa que las URIs sean HTTPS, exactas y sin comodines.';
    return 'No pudimos guardar el proveedor. Inténtalo de nuevo.';
  }
}
