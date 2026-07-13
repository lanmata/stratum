import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '@shared/models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  success(message: string, duration = 4000): void {
    this.add('success', message, duration);
  }

  error(message: string, duration = 8000): void {
    this.add('error', message, duration);
  }

  info(message: string, duration = 4000, copyValue?: string): void {
    this.add('info', message, duration, copyValue);
  }

  warning(message: string, duration = 6000): void {
    this.add('warning', message, duration);
  }

  dismiss(id: string): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(type: ToastType, message: string, duration: number, copyValue?: string): void {
    const id = crypto.randomUUID();
    this._toasts.update((toasts) => [...toasts, { id, type, message, duration, copyValue }]);
    if (duration > 0) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), duration));
    }
  }
}
