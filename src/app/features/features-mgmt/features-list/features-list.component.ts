import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureService } from '@core/services/feature.service';
import { Feature } from '@shared/models/feature.model';

@Component({
  selector: 'app-features-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a routerLink="/dashboard" class="text-sm text-blue-600 hover:underline">← Dashboard</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Features</h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      } @else {
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (feature of features(); track feature.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ feature.name }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ feature.description }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="feature.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
                    >
                      {{ feature.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">No features found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class FeaturesListComponent implements OnInit {
  private readonly featureService = inject(FeatureService);

  protected readonly features = signal<Feature[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.featureService.getAll(true).subscribe({
      next: (data) => {
        this.features.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
