import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageMockService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly memoryStore = new Map<string, string>();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getItem(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  clear(): void {
    if (this.isBrowser) {
      localStorage.clear();
    } else {
      this.memoryStore.clear();
    }
  }
}
