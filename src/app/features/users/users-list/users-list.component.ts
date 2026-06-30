import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { UserTO } from '@shared/models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
          <h1 class="mt-1 text-xl font-semibold text-gray-900">Users</h1>
        </div>
      </div>

      @if (error()) {
        <p class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-4 py-3">Alias</th>
                <th class="px-4 py-3">Display Name</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ user.alias }}</td>
                  <td class="px-4 py-3 text-gray-800">{{ user.displayName }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    >
                      {{ user.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-gray-400">No users found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);

  protected readonly users = signal<UserTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // TODO: replace placeholder applicationId with real value from store/route
    this.userService.getByApplication('00000000-0000-0000-0000-000000000000').subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users.');
        this.loading.set(false);
      },
    });
  }
}
