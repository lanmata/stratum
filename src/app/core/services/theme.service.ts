import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageMockService } from './storage-mock.service';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(StorageMockService);

  readonly isDark = signal(false);

  init(): void {
    const stored = this.storage.getItem(STORAGE_KEY);
    const prefersDark =
      isPlatformBrowser(this.platformId) &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    this.apply(dark);
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    this.storage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('dark', dark);
    }
  }
}
