import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersonService } from '@core/services/person.service';
import { Person } from '@shared/models/person.model';

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Personas</h1>
        </div>
        <a
          routerLink="/people/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nueva Persona
        </a>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Apellido</th>
                <th class="px-4 py-3">Género</th>
                <th class="px-4 py-3">Fecha de nacimiento</th>
                <th class="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (person of people(); track person.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ person.firstName }}</td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">{{ person.lastName }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ person.gender ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ person.birthdate ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <a
                      [routerLink]="['/people', person.id, 'edit']"
                      title="Editar"
                      class="inline-flex rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron personas</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class PeopleListComponent implements OnInit {
  private readonly personService = inject(PersonService);

  protected readonly people = signal<Person[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.personService.getAll().subscribe({
      next: (data) => {
        this.people.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
