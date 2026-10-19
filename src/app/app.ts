import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';
import { SessionKeepAliveService } from '@core/services/session-keepalive.service';
import { ThemeService } from '@core/services/theme.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    @if (loading.isLoading()) {
      <div class="animate-fade-in-delayed pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-blue-100 dark:bg-blue-950" role="progressbar" aria-label="Cargando">
        <div class="animate-loading-bar h-full w-1/3 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      </div>
    }
    <router-outlet />
    <app-toast />
  `,
})
export class App implements OnInit {
  protected readonly loading = inject(LoadingService);
  private readonly theme = inject(ThemeService);
  private readonly keepAlive = inject(SessionKeepAliveService);

  ngOnInit(): void {
    this.theme.init();
    this.keepAlive.start();
  }
}
