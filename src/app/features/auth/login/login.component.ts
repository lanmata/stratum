import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import {API} from "@shared/constants/api.constants";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 class="mb-6 text-2xl font-semibold text-gray-900">Backoffice</h1>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Alias</label>
            <input
              formControlName="alias"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="your.alias"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              formControlName="password"
              type="password"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          @if (error()) {
            <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{{ error() }}</p>
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

  protected readonly form = this.fb.nonNullable.group({
    alias: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.error.set(null);
    const { alias, password } = this.form.getRawValue();
    this.auth.loginWithAlias({ alias, password, applicationId: this.applicationId }).subscribe((ok) => {
      if (ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid credentials. Please try again.');
      }
    });
  }
}
