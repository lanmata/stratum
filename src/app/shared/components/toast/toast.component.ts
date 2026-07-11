import { Component, inject } from '@angular/core';
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

  protected bgClass(toast: Toast): string {
    if (toast.type === 'success') return 'bg-green-500';
    if (toast.type === 'error') return 'bg-red-500';
    if (toast.type === 'warning') return 'bg-amber-500';
    return 'bg-blue-500';
  }
}
