import { isPlatformBrowser } from '@angular/common';
import { Component, computed, DestroyRef, effect, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { StorageMockService } from '@core/services/storage-mock.service';
import { ProfileImageService } from '@core/services/profile-image.service';
import { ThemeService } from '@core/services/theme.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { CommandPaletteComponent } from './command-palette.component';
import { DASHBOARD_ITEM, NAV_GROUPS } from './nav-items';

const COLLAPSED_KEY = 'sidebar-collapsed';

const LINK_BASE = 'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ';
const LINK_IDLE = LINK_BASE + 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-100';
const LINK_ACTIVE = LINK_BASE + 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, BreadcrumbsComponent, CommandPaletteComponent],
  template: `
    <div class="flex h-dvh overflow-hidden bg-gray-50 dark:bg-gray-900">
      @if (mobileOpen()) {
        <div class="animate-fade-in fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm lg:hidden" (click)="mobileOpen.set(false)"></div>
      }

      <aside [class]="sidebarClass()" aria-label="Navegación principal">
        <div class="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
            B
          </div>
          @if (labelsVisible()) {
            <span class="animate-fade-in truncate text-base font-semibold text-gray-900 dark:text-gray-100">Backoffice</span>
          }
          <button
            type="button"
            class="ml-auto rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Cerrar menú"
            (click)="mobileOpen.set(false)"
          >
            <app-icon name="close" />
          </button>
        </div>

        <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <a
            [routerLink]="dashboard.path"
            routerLinkActive
            #dashLink="routerLinkActive"
            ariaCurrentWhenActive="page"
            [class]="dashLink.isActive ? linkActive : linkIdle"
            [title]="labelsVisible() ? '' : dashboard.label"
          >
            <app-icon [name]="dashboard.icon" />
            @if (labelsVisible()) { <span class="truncate">{{ dashboard.label }}</span> }
          </a>

          @for (group of groups; track group.name) {
            <div>
              @if (labelsVisible()) {
                <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ group.name }}</p>
              } @else {
                <div class="mx-3 mb-2 border-t border-gray-200 dark:border-gray-700"></div>
              }
              <div class="space-y-1">
                @for (item of group.items; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive
                    #link="routerLinkActive"
                    ariaCurrentWhenActive="page"
                    [class]="link.isActive ? linkActive : linkIdle"
                    [title]="labelsVisible() ? '' : item.label"
                  >
                    <app-icon [name]="item.icon" />
                    @if (labelsVisible()) { <span class="truncate">{{ item.label }}</span> }
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <div class="hidden shrink-0 border-t border-gray-200 p-3 lg:block dark:border-gray-700">
          <button
            type="button"
            (click)="toggleCollapsed()"
            [class]="linkIdle + ' w-full'"
            [attr.aria-label]="collapsed() ? 'Expandir menú' : 'Contraer menú'"
          >
            <app-icon name="chevrons-left" [size]="collapsed() ? 'h-5 w-5 rotate-180 transition-transform' : 'h-5 w-5 transition-transform'" />
            @if (labelsVisible()) { <span>Contraer</span> }
          </button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-gray-700 dark:bg-gray-900/80">
          <button
            type="button"
            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Abrir menú"
            (click)="mobileOpen.set(true)"
          >
            <app-icon name="menu" />
          </button>

          <app-breadcrumbs class="min-w-0 flex-1" />

          <button
            type="button"
            (click)="paletteOpen.set(true)"
            class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-300"
            aria-label="Búsqueda rápida"
          >
            <app-icon name="search" size="h-4 w-4" />
            <span class="hidden md:inline">Buscar…</span>
            <kbd class="hidden rounded border border-gray-200 px-1.5 text-[10px] font-medium md:inline dark:border-gray-600">Ctrl K</kbd>
          </button>

          <button
            type="button"
            (click)="theme.toggle()"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            [title]="theme.isDark() ? 'Modo claro' : 'Modo oscuro'"
          >
            <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
          </button>

          <div class="relative">
            <button
              type="button"
              (click)="toggleUserMenu($event)"
              class="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-haspopup="menu"
              [attr.aria-expanded]="userMenuOpen()"
            >
              @if (avatarUrl(); as url) {
                <img [src]="url" alt="" class="h-8 w-8 rounded-full object-cover" />
              } @else {
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                  {{ initials() }}
                </span>
              }
              <span class="hidden max-w-32 truncate text-sm font-medium text-gray-700 sm:inline dark:text-gray-200">{{ userAlias() }}</span>
            </button>
            @if (userMenuOpen()) {
              <div
                role="menu"
                class="animate-pop-in absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <div class="px-3 py-2">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ userAlias() }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Sesión activa</p>
                </div>
                <div class="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                <button
                  type="button"
                  role="menuitem"
                  (click)="auth.logout()"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <app-icon name="logout" size="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            }
          </div>
        </header>

        <main class="flex-1 overflow-y-auto">
          <div class="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>

    @if (paletteOpen()) {
      <app-command-palette (closed)="paletteOpen.set(false)" />
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly store = inject(SessionStoreService);
  private readonly storage = inject(StorageMockService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly profileImage = inject(ProfileImageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly avatarUrl = signal<string | null>(null);

  protected readonly dashboard = DASHBOARD_ITEM;
  protected readonly groups = NAV_GROUPS;
  protected readonly linkIdle = LINK_IDLE;
  protected readonly linkActive = LINK_ACTIVE;

  protected readonly collapsed = signal(this.storage.getItem(COLLAPSED_KEY) === 'true');
  protected readonly mobileOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  protected readonly paletteOpen = signal(false);

  private readonly user = toSignal(this.store.user$, { initialValue: null });
  protected readonly userAlias = computed(() => this.user()?.alias || this.user()?.displayName || 'Usuario');
  protected readonly initials = computed(() =>
    this.userAlias()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  protected readonly labelsVisible = computed(() => !this.collapsed() || this.mobileOpen());
  protected readonly sidebarClass = computed(
    () =>
      'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-out lg:static lg:translate-x-0 dark:border-gray-700 dark:bg-gray-800 ' +
      (this.collapsed() ? 'w-64 lg:w-[4.5rem] ' : 'w-64 ') +
      (this.mobileOpen() ? 'translate-x-0 shadow-2xl' : '-translate-x-full'),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileOpen.set(false);
        this.userMenuOpen.set(false);
      });

    this.loadAvatar();

    effect(() => {
      const crumbs = this.breadcrumbs.crumbs();
      const current = crumbs.at(-1)?.label ?? DASHBOARD_ITEM.label;
      this.title.setTitle(`${current} · Backoffice`);
    });
  }

  private loadAvatar(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.profileImage.getImage().subscribe({
      next: (blob) => {
        if (blob.size === 0) return;
        this.avatarUrl.set(URL.createObjectURL(blob));
      },
      error: () => this.avatarUrl.set(null),
    });
    this.destroyRef.onDestroy(() => {
      const url = this.avatarUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
    this.storage.setItem(COLLAPSED_KEY, String(this.collapsed()));
  }

  protected toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  @HostListener('document:click')
  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.paletteOpen.update((v) => !v);
    } else if (event.key === 'Escape') {
      this.userMenuOpen.set(false);
      this.mobileOpen.set(false);
    }
  }
}
