import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ManagedClientService } from '@core/services/managed-client.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ManagedClientTO } from '@shared/models/managed-client.model';

@Component({
  selector: 'app-application-managed-clients',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe, ConfirmDialogComponent],
  template: `
    <div class="p-6">

      <!-- One-time secret banner (create) -->
      @if (oneTimeSecret()) {
        <div class="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <p class="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                ⚠️ Cliente creado — guarda el secreto ahora
              </p>
              <p class="mb-2 text-xs text-yellow-700 dark:text-yellow-400">
                Esta es la única vez que se mostrará el secreto.
              </p>
              <code class="block break-all rounded bg-yellow-100 px-3 py-2 text-xs font-mono text-yellow-900 dark:bg-yellow-800/40 dark:text-yellow-200">
                {{ oneTimeSecret() }}
              </code>
            </div>
            <div class="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                (click)="copySecret(oneTimeSecret()!)"
                class="rounded-lg border border-yellow-400 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800/30"
              >
                Copiar
              </button>
              <button
                type="button"
                (click)="oneTimeSecret.set(null)"
                class="rounded-lg px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Rotate secret banner -->
      @if (rotatedSecret()) {
        <div class="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <p class="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                🔄 Secreto rotado — guarda el nuevo secreto ahora
              </p>
              @if (rotatedSecret()!.gracePeriodSeconds) {
                <p class="mb-2 text-xs text-yellow-700 dark:text-yellow-400">
                  El secreto anterior sigue siendo válido por {{ rotatedSecret()!.gracePeriodSeconds }} segundos.
                </p>
              }
              <code class="block break-all rounded bg-yellow-100 px-3 py-2 text-xs font-mono text-yellow-900 dark:bg-yellow-800/40 dark:text-yellow-200">
                {{ rotatedSecret()!.clientSecret }}
              </code>
            </div>
            <div class="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                (click)="copySecret(rotatedSecret()!.clientSecret)"
                class="rounded-lg border border-yellow-400 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800/30"
              >
                Copiar
              </button>
              <button
                type="button"
                (click)="rotatedSecret.set(null)"
                class="rounded-lg px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando clientes M2M…</p>
      } @else {

        <!-- Create form -->
        <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Nuevo Cliente M2M
          </h2>
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input
                  formControlName="name"
                  type="text"
                  maxlength="128"
                  placeholder="mi-servicio-backend"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  [class.border-red-400]="form.controls.name.invalid && form.controls.name.touched"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Scopes <span class="text-red-500">*</span>
                  <span class="font-normal text-gray-400"> (separados por coma)</span>
                </label>
                <input
                  formControlName="scopes"
                  type="text"
                  placeholder="read:data, write:data"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  [class.border-red-400]="form.controls.scopes.invalid && form.controls.scopes.touched"
                />
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <input
                formControlName="description"
                type="text"
                maxlength="512"
                placeholder="Descripción opcional"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="form.controls.active.setValue(!form.controls.active.value)"
                  class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                  [class]="form.controls.active.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                    [class]="form.controls.active.value ? 'translate-x-4' : 'translate-x-1'"
                  ></span>
                </button>
                <span class="text-xs text-gray-600 dark:text-gray-400">{{ form.controls.active.value ? 'Activo' : 'Inactivo' }}</span>
              </div>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving() ? 'Registrando…' : 'Registrar cliente' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Client list -->
        @if (clients().length === 0) {
          <p class="text-sm text-gray-400 dark:text-gray-500">Esta aplicación no tiene clientes M2M registrados.</p>
        } @else {
          <div class="space-y-3">
            @for (client of clients(); track client.clientId) {
              <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ client.name }}</span>
                      @if (client.active) {
                        <span class="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Activo</span>
                      } @else {
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
                      }
                    </div>
                    @if (client.description) {
                      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ client.description }}</p>
                    }
                    <div class="mt-2 flex flex-wrap gap-1">
                      @for (scope of client.scopes; track scope) {
                        <span class="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-mono text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {{ scope }}
                        </span>
                      }
                    </div>
                    @if (client.createdAt) {
                      <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Creado: {{ client.createdAt | slice:0:10 }}
                        @if (client.secretLastRotatedAt) {
                          · Secreto rotado: {{ client.secretLastRotatedAt | slice:0:10 }}
                        }
                      </p>
                    }
                    <p class="mt-0.5 text-xs text-gray-300 font-mono dark:text-gray-600">{{ client.clientId }}</p>
                  </div>

                  <!-- Actions -->
                  <div class="flex shrink-0 flex-wrap items-center gap-1">
                    <!-- Toggle active -->
                    <button
                      type="button"
                      (click)="toggleActive(client)"
                      [title]="client.active ? 'Desactivar' : 'Activar'"
                      class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                      [class]="client.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <span
                        class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                        [class]="client.active ? 'translate-x-4' : 'translate-x-1'"
                      ></span>
                    </button>

                    <!-- Rotate secret -->
                    <button
                      type="button"
                      title="Rotar secreto"
                      (click)="onRotateClick(client.clientId)"
                      class="rounded-lg p-1.5 text-yellow-600 transition-colors hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </button>

                    <!-- Revoke tokens -->
                    <button
                      type="button"
                      title="Revocar todos los tokens"
                      (click)="onRevokeClick(client.clientId)"
                      class="rounded-lg p-1.5 text-orange-500 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                    </button>

                    <!-- Delete -->
                    <button
                      type="button"
                      title="Eliminar"
                      (click)="onDeleteClick(client.clientId)"
                      class="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    @if (showConfirm()) {
      <app-confirm-dialog
        [message]="confirmMessage()"
        (confirmed)="onConfirmed()"
        (cancelled)="showConfirm.set(false)"
      />
    }
  `,
})
export class ApplicationManagedClientsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ManagedClientService);
  private readonly toast = inject(ToastService);

  private readonly applicationId = this.route.parent!.snapshot.paramMap.get('applicationId')!;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly clients = signal<ManagedClientTO[]>([]);
  protected readonly oneTimeSecret = signal<string | null>(null);
  protected readonly rotatedSecret = signal<{ clientSecret: string; gracePeriodSeconds?: number } | null>(null);
  protected readonly showConfirm = signal(false);
  protected readonly confirmMessage = signal('');
  private pendingAction: (() => void) | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    scopes: ['', Validators.required],
    description: ['', Validators.maxLength(512)],
    active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { name, scopes, description, active } = this.form.getRawValue();
    const scopeList = scopes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.service
      .create({
        name,
        applicationId: this.applicationId,
        scopes: scopeList,
        description: description || undefined,
        active,
      })
      .subscribe({
        next: (created) => {
          this.clients.update((list) => [
            {
              clientId: created.clientId,
              name: created.name,
              applicationId: created.applicationId,
              scopes: created.scopes,
              active: created.active,
              createdAt: created.createdAt,
            },
            ...list,
          ]);
          this.oneTimeSecret.set(created.clientSecret);
          this.form.reset({ name: '', scopes: '', description: '', active: true });
          this.toast.success('Cliente M2M registrado');
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Error al registrar el cliente');
          this.saving.set(false);
        },
      });
  }

  protected toggleActive(client: ManagedClientTO): void {
    this.service.update(client.clientId, { active: !client.active }).subscribe({
      next: (updated) => {
        this.clients.update((list) =>
          list.map((c) => (c.clientId === updated.clientId ? updated : c))
        );
      },
      error: () => this.toast.error('Error al actualizar el estado'),
    });
  }

  protected onRotateClick(clientId: string): void {
    this.confirmMessage.set('¿Rotar el secreto de este cliente? El secreto actual dejará de funcionar (salvo período de gracia).');
    this.pendingAction = () => {
      this.service.rotateSecret(clientId).subscribe({
        next: (result) => {
          this.rotatedSecret.set({ clientSecret: result.clientSecret, gracePeriodSeconds: result.gracePeriodSeconds });
          this.toast.success('Secreto rotado');
        },
        error: () => this.toast.error('Error al rotar el secreto'),
      });
    };
    this.showConfirm.set(true);
  }

  protected onRevokeClick(clientId: string): void {
    this.confirmMessage.set('¿Revocar todos los tokens activos de este cliente? Las integraciones dejarán de funcionar hasta que obtengan un nuevo token.');
    this.pendingAction = () => {
      this.service.revokeAllTokens(clientId).subscribe({
        next: () => this.toast.success('Tokens revocados'),
        error: () => this.toast.error('Error al revocar los tokens'),
      });
    };
    this.showConfirm.set(true);
  }

  protected onDeleteClick(clientId: string): void {
    this.confirmMessage.set('¿Eliminar este cliente M2M? Se revocarán todos sus tokens activos. Esta acción no se puede deshacer.');
    this.pendingAction = () => {
      this.service.delete(clientId).subscribe({
        next: () => {
          this.clients.update((list) => list.filter((c) => c.clientId !== clientId));
          this.toast.success('Cliente eliminado');
        },
        error: () => this.toast.error('Error al eliminar el cliente'),
      });
    };
    this.showConfirm.set(true);
  }

  protected onConfirmed(): void {
    this.showConfirm.set(false);
    this.pendingAction?.();
    this.pendingAction = null;
  }

  protected copySecret(secret: string): void {
    navigator.clipboard.writeText(secret).then(
      () => this.toast.success('Secreto copiado al portapapeles'),
      () => this.toast.error('No se pudo copiar al portapapeles')
    );
  }

  private load(): void {
    this.loading.set(true);
    this.service.list(this.applicationId).subscribe({
      next: (list) => {
        this.clients.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los clientes M2M');
        this.loading.set(false);
      },
    });
  }
}
