import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FederationService } from '@core/services/federation.service';
import { ToastService } from '@core/services/toast.service';
import { LinkedIdentity } from '@shared/models/federation.model';

/**
 * Las cuentas externas (Google, Microsoft, Apple, GitHub, Meta) enlazadas a un usuario, con «Desenlazar». Quitar un enlace nunca
 * deja a nadie fuera: la contraseña de todo usuario sigue existiendo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-linked-identities',
  standalone: true,
  template: `
    <section aria-labelledby="linked-identities-title" class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 id="linked-identities-title" class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Cuentas enlazadas</h2>
      @if (failed()) {
        <p role="alert" data-testid="problem" class="text-sm text-red-600 dark:text-red-400">No pudimos cargar o cambiar las cuentas enlazadas.</p>
      }
      @if (identities().length === 0) {
        <p data-testid="empty" class="text-sm text-gray-500 dark:text-gray-400">Sin cuentas enlazadas.</p>
      } @else {
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          @for (identity of identities(); track identity.id) {
            <li class="flex items-center justify-between gap-3 py-2" [attr.data-identity]="identity.id">
              <div class="min-w-0">
                <p class="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{{ identity.provider }}</p>
                <p class="truncate text-xs text-gray-500">{{ identity.email || identity.displayName || 'Sin datos del proveedor' }}</p>
              </div>
              @if (confirming() === identity.id) {
                <div class="flex gap-2">
                  <button type="button" data-action="confirm" (click)="unlink(identity.id)" class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white">Confirmar</button>
                  <button type="button" data-action="cancel" (click)="confirming.set(null)" class="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-300">Cancelar</button>
                </div>
              } @else {
                <button type="button" data-action="unlink" (click)="confirming.set(identity.id)" class="text-xs text-red-600 hover:underline dark:text-red-400">Desenlazar</button>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class LinkedIdentitiesComponent implements OnInit {
  private readonly federation = inject(FederationService);
  private readonly toast = inject(ToastService);

  readonly userId = input.required<string>();

  protected readonly identities = signal<LinkedIdentity[]>([]);
  protected readonly confirming = signal<string | null>(null);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.federation.identities(this.userId()).subscribe({
      next: (identities) => {
        this.identities.set(identities);
        this.failed.set(false);
      },
      error: () => {
        this.identities.set([]);
        this.failed.set(true);
      },
    });
  }

  protected unlink(identityId: string): void {
    this.confirming.set(null);
    this.federation.unlink(this.userId(), identityId).subscribe({
      next: () => {
        this.toast.success('Cuenta desenlazada');
        this.load();
      },
      error: () => this.failed.set(true),
    });
  }
}
