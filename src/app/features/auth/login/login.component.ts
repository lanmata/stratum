import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import {API} from "@shared/constants/api.constants";

type LoginMode = 'alias' | 'email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-4 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900">
      <div class="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"></div>
      <div class="animate-pop-in relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-sm">B</div>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Backoffice</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Inicia sesión para continuar</p>
          </div>
        </div>

        <div class="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium dark:bg-gray-700" role="tablist" aria-label="Método de inicio de sesión">
          <button
            type="button"
            role="tab"
            id="login-mode-alias"
            [attr.aria-selected]="mode() === 'alias'"
            (click)="setMode('alias')"
            [class]="mode() === 'alias' ? tabActive : tabIdle"
          >
            Alias
          </button>
          <button
            type="button"
            role="tab"
            id="login-mode-email"
            [attr.aria-selected]="mode() === 'email'"
            (click)="setMode('email')"
            [class]="mode() === 'email' ? tabActive : tabIdle"
          >
            Email
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ mode() === 'alias' ? 'Alias' : 'Email' }}
            </label>
            <input
              formControlName="identifier"
              [type]="mode() === 'alias' ? 'text' : 'email'"
              [attr.autocomplete]="mode() === 'alias' ? 'username' : 'email'"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              [placeholder]="mode() === 'alias' ? 'your.alias' : 'you@example.com'"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              formControlName="password"
              type="password"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          @if (error()) {
            <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || auth.isLoading()"
            class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (auth.isLoading()) { Signing in… } @else { Sign in }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly applicationId = API.APPLICATION.ID;

  protected readonly error = signal<string | null>(null);
  protected readonly mode = signal<LoginMode>('alias');

  protected readonly tabIdle = 'rounded-md px-3 py-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200';
  protected readonly tabActive = 'rounded-md bg-white px-3 py-1.5 text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400';

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected setMode(mode: LoginMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.error.set(null);
    this.form.controls.identifier.reset('');
    this.form.controls.identifier.setValidators(
      mode === 'email' ? [Validators.required, Validators.email] : [Validators.required],
    );
    this.form.controls.identifier.updateValueAndValidity();
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.error.set(null);
    const { identifier, password } = this.form.getRawValue();
    const login$ =
      this.mode() === 'alias'
        ? this.auth.loginWithAlias({ alias: identifier, password, applicationId: this.applicationId })
        : this.auth.loginWithEmail({ email: identifier, password });
    login$.subscribe((ok) => {
      if (ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid credentials. Please try again.');
      }
    });
  }
}
