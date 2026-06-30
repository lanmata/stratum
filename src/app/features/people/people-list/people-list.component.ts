import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersonService } from '@core/services/person.service';
import { Person } from '@shared/models/person.model';

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mb-6">
        <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900">People</h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-4 py-3">First Name</th>
                <th class="px-4 py-3">Last Name</th>
                <th class="px-4 py-3">Gender</th>
                <th class="px-4 py-3">Birthdate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (person of people(); track person.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-gray-800">{{ person.firstName }}</td>
                  <td class="px-4 py-3 text-gray-800">{{ person.lastName }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ person.gender ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ person.birthdate ?? '—' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400">No records found</td>
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
