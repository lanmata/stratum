import { Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 class="mb-2 text-lg font-semibold text-gray-900">{{ title() }}</h2>
        <p class="mb-6 text-sm text-gray-600">{{ message() }}</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {{ cancelLabel() }}
          </button>
          <button
            type="button"
            (click)="confirmed.emit()"
            [class]="
              confirmStyle() === 'danger'
                ? 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
                : 'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            "
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title = input<string>('Confirmar acción');
  message = input.required<string>();
  confirmLabel = input<string>('Confirmar');
  cancelLabel = input<string>('Cancelar');
  confirmStyle = input<'danger' | 'primary'>('danger');

  confirmed = output<void>();
  cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelled.emit();
  }
}
