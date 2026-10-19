import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

interface RawCrumb extends Breadcrumb {
  key?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly raw = signal<RawCrumb[]>([]);
  private readonly labels = signal<Record<string, string>>({});

  readonly crumbs = computed<Breadcrumb[]>(() =>
    this.raw().map(({ label, url, key }) => ({
      label: (key && this.labels()[key]) || label,
      url,
    })),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.raw.set(this.build(this.router.routerState.snapshot.root)));
  }

  setLabel(key: string, label: string): void {
    this.labels.update((current) => ({ ...current, [key]: label }));
  }

  private build(root: ActivatedRouteSnapshot): RawCrumb[] {
    const crumbs: RawCrumb[] = [];
    let url = '';
    let route: ActivatedRouteSnapshot | null = root;
    while (route) {
      const segment = route.url.map((s) => s.path).join('/');
      if (segment) url += `/${segment}`;
      const data = route.routeConfig?.data;
      const label = data?.['breadcrumb'] as string | undefined;
      if (label) {
        const param = data?.['breadcrumbKey'] as string | undefined;
        crumbs.push({ label, url: url || '/', key: param ? route.params[param] : undefined });
      }
      route = route.firstChild;
    }
    return crumbs;
  }
}
