import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';
import { ThemeService } from '@core/services/theme.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }
    <router-outlet />
    <app-toast />
  `,
})
export class App implements OnInit {
  protected readonly loading = inject(LoadingService);
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.init();
  }
}
