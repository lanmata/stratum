import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { Toast } from '@shared/models/toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex min-w-64 max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-white shadow-lg"
          [class]="bgClass(toast)"
        >
          <span class="flex-1 text-sm">{{ toast.message }}</span>
          @if (toast.copyValue) {
            <button
              type="button"
              (click)="copy(toast)"
              class="shrink-0 rounded border border-white/40 px-2 py-0.5 text-xs text-white hover:bg-white/20"
            >
              {{ copiedId() === toast.id ? '✓ Copiado' : 'Copiar' }}
            </button>
          }
          <button
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 text-white/80 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly copiedId = signal<string | null>(null);

  protected bgClass(toast: Toast): string {
    if (toast.type === 'success') return 'bg-green-500';
    if (toast.type === 'error') return 'bg-red-500';
    if (toast.type === 'warning') return 'bg-amber-500';
    return 'bg-blue-500';
  }

  protected copy(toast: Toast): void {
    if (!isPlatformBrowser(this.platformId) || !toast.copyValue) return;
    navigator.clipboard.writeText(toast.copyValue).then(() => {
      this.copiedId.set(toast.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }
}
