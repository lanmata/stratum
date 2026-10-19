import { Component, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApplicationService } from '@core/services/application.service';
import { IamService } from '@core/services/iam.service';
import { ToastService } from '@core/services/toast.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { Application } from '@shared/models/application.model';
import { PermissionCheckResponse, TokenIntrospectResponse } from '@shared/models/iam.model';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

@Component({
  selector: 'app-iam-tools',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Herramientas IAM</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Diagnostica tokens de sesión y verifica permisos de un usuario.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Introspección de token
          </h2>
          <form [formGroup]="introspectForm" (ngSubmit)="introspect()" class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="iam-token">Token</label>
              <textarea id="iam-token" formControlName="token" rows="4" [class]="inputClass"></textarea>
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                [disabled]="introspectForm.invalid || introspecting()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ introspecting() ? 'Consultando…' : 'Introspeccionar' }}
              </button>
              <button
                type="button"
                (click)="useMyToken(introspectForm.controls.token)"
                [disabled]="!myToken()"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Usar mi token
              </button>
            </div>
          </form>

          @if (introspection(); as info) {
            <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
              <dt class="font-medium">Activo</dt>
              <dd>{{ info.active ? 'Sí' : 'No' }}</dd>
              @if (info.subject) { <dt class="font-medium">Sujeto</dt><dd class="break-all font-mono text-xs">{{ info.subject }}</dd> }
              @if (info.issuer) { <dt class="font-medium">Emisor</dt><dd>{{ info.issuer }}</dd> }
              @if (info.audience) { <dt class="font-medium">Audiencia</dt><dd>{{ info.audience }}</dd> }
              @if (info.tokenType) { <dt class="font-medium">Tipo</dt><dd>{{ info.tokenType }}</dd> }
              @if (info.issuedAt) { <dt class="font-medium">Emitido</dt><dd>{{ formatEpoch(info.issuedAt) }}</dd> }
              @if (info.expiresAt) { <dt class="font-medium">Expira</dt><dd>{{ formatEpoch(info.expiresAt) }}</dd> }
              @if (info.roles?.length) { <dt class="font-medium">Roles</dt><dd>{{ info.roles!.join(', ') }}</dd> }
            </dl>
          }
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Verificación de permiso
          </h2>
          <form [formGroup]="permissionForm" (ngSubmit)="checkPermission()" class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="iam-permission">
                Permiso (rol o feature)
              </label>
              <input id="iam-permission" formControlName="permission" type="text" placeholder="ROLE_ADMIN" [class]="inputClass" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="iam-application">
                Aplicación <span class="font-normal text-gray-400">(opcional)</span>
              </label>
              <select id="iam-application" formControlName="applicationId" [class]="inputClass">
                <option value="">Todas (según el token)</option>
                @for (app of applications(); track app.id) {
                  <option [value]="app.id">{{ app.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="iam-session-token">
                Token de sesión
              </label>
              <textarea id="iam-session-token" formControlName="sessionToken" rows="3" [class]="inputClass"></textarea>
            </div>
            <div class="flex gap-2">
              <button
                type="submit"
                [disabled]="permissionForm.invalid || checking()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ checking() ? 'Verificando…' : 'Verificar permiso' }}
              </button>
              <button
                type="button"
                (click)="useMyToken(permissionForm.controls.sessionToken)"
                [disabled]="!myToken()"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Usar mi token
              </button>
            </div>
          </form>

          @if (permission(); as result) {
            <div
              class="mt-4 rounded-lg px-3 py-2 text-sm"
              [class]="result.granted
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'"
              role="status"
            >
              <p class="font-medium">
                {{ result.granted ? 'Permiso concedido' : 'Permiso denegado' }} · {{ result.permission }}
              </p>
              @if (result.reason) {
                <p class="mt-0.5 text-xs">{{ result.reason }}</p>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class IamToolsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly iam = inject(IamService);
  private readonly applicationService = inject(ApplicationService);
  private readonly session = inject(SessionStoreService);
  private readonly toast = inject(ToastService);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly myToken = toSignal(this.session.token$, { initialValue: null });
  protected readonly applications = signal<Application[]>([]);

  protected readonly introspecting = signal(false);
  protected readonly introspection = signal<TokenIntrospectResponse | null>(null);
  protected readonly checking = signal(false);
  protected readonly permission = signal<PermissionCheckResponse | null>(null);

  protected readonly introspectForm = this.fb.nonNullable.group({
    token: ['', Validators.required],
  });

  protected readonly permissionForm = this.fb.nonNullable.group({
    permission: ['', Validators.required],
    applicationId: [''],
    sessionToken: ['', Validators.required],
  });

  ngOnInit(): void {
    this.applicationService
      .getAll()
      .pipe(catchError(() => of([] as Application[])))
      .subscribe((apps) => this.applications.set(apps));
  }

  protected useMyToken(control: { setValue(value: string): void }): void {
    const token = this.myToken();
    if (token) control.setValue(token);
  }

  protected introspect(): void {
    if (this.introspectForm.invalid || this.introspecting()) return;
    this.introspecting.set(true);
    this.introspection.set(null);
    this.iam.introspectToken(this.introspectForm.getRawValue().token.trim()).subscribe({
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

  protected checkPermission(): void {
    if (this.permissionForm.invalid || this.checking()) return;
    const { permission, applicationId, sessionToken } = this.permissionForm.getRawValue();
    this.checking.set(true);
    this.permission.set(null);
    this.iam
      .checkPermission({
        permission: permission.trim(),
        sessionToken: sessionToken.trim(),
        ...(applicationId ? { applicationId } : {}),
      })
      .subscribe({
        next: (res) => {
          this.permission.set(res);
          this.checking.set(false);
        },
        error: () => {
          this.toast.error('Error al verificar el permiso');
          this.checking.set(false);
        },
      });
  }

  protected formatEpoch(seconds: number): string {
    return new Date(seconds * 1000).toLocaleString('es');
  }
}
