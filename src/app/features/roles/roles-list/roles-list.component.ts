import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoleService } from '@core/services/role.service';
import { Role } from '@shared/models/role.model';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="mb-6">
        <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900">Roles</h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (role of roles(); track role.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ role.name }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ role.description }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="role.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    >
                      {{ role.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400">No roles found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class RolesListComponent implements OnInit {
  private readonly roleService = inject(RoleService);

  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.roleService.getAll(true).subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
