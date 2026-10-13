import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center dark:bg-gray-900">
      <div class="animate-pop-in flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-4xl text-white shadow-lg">🚫</div>
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">Acceso denegado</h1>
      <p class="max-w-sm text-sm text-gray-500 dark:text-gray-400">No tienes permiso para acceder a este recurso.</p>
      <a routerLink="/dashboard" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        Ir al inicio
      </a>
    </div>
  `,
})
export class ForbiddenComponent {}
