import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <span class="text-5xl">🚫</span>
      <h1 class="text-2xl font-semibold text-gray-800">Access Denied</h1>
      <p class="text-sm text-gray-500">You don't have permission to access this resource.</p>
      <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">Go to dashboard</a>
    </div>
  `,
})
export class ForbiddenComponent {}
