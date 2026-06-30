import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }
    <router-outlet />
  `,
})
export class App {
  protected readonly loading = inject(LoadingService);
}
