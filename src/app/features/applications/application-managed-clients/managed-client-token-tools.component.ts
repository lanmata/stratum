import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ManagedClientService } from '@core/services/managed-client.service';
import { ToastService } from '@core/services/toast.service';
import {
  ManagedClientTO,
  ManagedClientTokenIntrospectResponse,
  ManagedClientTokenResponse,
} from '@shared/models/managed-client.model';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

export function splitScopes(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function issueErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'El scope solicitado no es válido para este cliente.';
    case 401:
      return 'Credenciales inválidas o cliente inactivo.';
    case 429:
      return 'Demasiadas solicitudes. Inténtalo de nuevo en unos instantes.';
    default:
      return 'Error al emitir el token.';
  }
}

@Component({
  selector: 'app-managed-client-token-tools',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Emitir token M2M
        </h2>
        <form [formGroup]="issueForm" (ngSubmit)="issue()" class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="issue-client">Cliente</label>
            <select id="issue-client" formControlName="clientId" [class]="inputClass">
              <option value="">— Seleccionar cliente —</option>
              @for (client of clients(); track client.clientId) {
                <option [value]="client.clientId">{{ client.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="issue-secret">Secreto</label>
            <input id="issue-secret" formControlName="clientSecret" type="password" autocomplete="off" [class]="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="issue-scopes">
              Scopes <span class="font-normal text-gray-400">(separados por coma)</span>
            </label>
            <input id="issue-scopes" formControlName="scopes" type="text" placeholder="read:data" [class]="inputClass" />
          </div>
          <button
            type="submit"
            [disabled]="issueForm.invalid || issuing()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ issuing() ? 'Emitiendo…' : 'Emitir token' }}
          </button>
        </form>

        @if (issueError(); as msg) {
          <p class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{{ msg }}</p>
        }
        @if (issued(); as token) {
          <div class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <code class="block break-all rounded bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-700">{{ token.accessToken }}</code>
            <p>
              Tipo: <strong>{{ token.tokenType }}</strong> · Expira en <strong>{{ token.expiresIn }}s</strong>
            </p>
            <p>Scopes: {{ token.scopes.join(', ') }}</p>
            <button
              type="button"
              (click)="copy(token.accessToken)"
              class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Copiar token
            </button>
          </div>
        }
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Introspección de token M2M
        </h2>
        <form [formGroup]="introspectForm" (ngSubmit)="introspect()" class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="introspect-token">Token</label>
            <textarea id="introspect-token" formControlName="token" rows="4" [class]="inputClass"></textarea>
          </div>
          <button
            type="submit"
            [disabled]="introspectForm.invalid || introspecting()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ introspecting() ? 'Consultando…' : 'Introspeccionar' }}
          </button>
        </form>

        @if (introspection(); as info) {
          <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
            <dt class="font-medium">Activo</dt>
            <dd>{{ info.active ? 'Sí' : 'No' }}</dd>
            @if (info.clientId) { <dt class="font-medium">Cliente</dt><dd class="font-mono text-xs">{{ info.clientName ?? '' }} ({{ info.clientId }})</dd> }
            @if (info.scopes?.length) { <dt class="font-medium">Scopes</dt><dd>{{ info.scopes!.join(', ') }}</dd> }
            @if (info.issuer) { <dt class="font-medium">Emisor</dt><dd>{{ info.issuer }}</dd> }
            @if (info.iat) { <dt class="font-medium">Emitido</dt><dd>{{ formatEpoch(info.iat) }}</dd> }
            @if (info.exp) { <dt class="font-medium">Expira</dt><dd>{{ formatEpoch(info.exp) }}</dd> }
            @if (info.jti) { <dt class="font-medium">JTI</dt><dd class="break-all font-mono text-xs">{{ info.jti }}</dd> }
          </dl>
        }
      </section>
    </div>
  `,
})
export class ManagedClientTokenToolsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ManagedClientService);
  private readonly toast = inject(ToastService);

  readonly clients = input<ManagedClientTO[]>([]);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly issuing = signal(false);
  protected readonly issued = signal<ManagedClientTokenResponse | null>(null);
  protected readonly issueError = signal<string | null>(null);
  protected readonly introspecting = signal(false);
  protected readonly introspection = signal<ManagedClientTokenIntrospectResponse | null>(null);

  protected readonly issueForm = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    clientSecret: ['', Validators.required],
    scopes: ['', Validators.required],
  });

  protected readonly introspectForm = this.fb.nonNullable.group({
    token: ['', Validators.required],
  });

  protected issue(): void {
    if (this.issueForm.invalid || this.issuing()) return;
    const { clientId, clientSecret, scopes } = this.issueForm.getRawValue();
    const scopeList = splitScopes(scopes);
    if (scopeList.length === 0) return;

    this.issuing.set(true);
    this.issueError.set(null);
    this.issued.set(null);
    this.service.issueToken({ clientId, clientSecret, scopes: scopeList }).subscribe({
      next: (res) => {
        this.issued.set(res);
        this.issuing.set(false);
        this.issueForm.controls.clientSecret.reset('');
      },
      error: (err: HttpErrorResponse) => {
        this.issueError.set(issueErrorMessage(err.status));
        this.issuing.set(false);
      },
    });
  }

  protected introspect(): void {
    if (this.introspectForm.invalid || this.introspecting()) return;
    this.introspecting.set(true);
    this.introspection.set(null);
    this.service.introspectToken(this.introspectForm.getRawValue().token.trim()).subscribe({
      next: (res) => {
        this.introspection.set(res);
        this.introspecting.set(false);
      },
      error: () => {
        this.toast.error('Error al introspeccionar el token');
        this.introspecting.set(false);
      },
    });
  }

  protected copy(value: string): void {
    navigator.clipboard.writeText(value).then(
      () => this.toast.success('Token copiado al portapapeles'),
      () => this.toast.error('No se pudo copiar al portapapeles'),
    );
  }

  protected formatEpoch(seconds: number): string {
    return new Date(seconds * 1000).toLocaleString('es');
  }
}
