import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <nav aria-label="Breadcrumb" class="min-w-0">
      <ol class="flex items-center gap-1 text-sm">
        <li class="flex shrink-0 items-center">
          <a
            routerLink="/dashboard"
            class="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            <app-icon name="home" size="h-4 w-4" />
            <span class="hidden sm:inline">Inicio</span>
          </a>
        </li>
        @for (crumb of breadcrumbs.crumbs(); track crumb.url; let last = $last) {
          <li [class]="last ? 'flex min-w-0 items-center gap-1' : 'hidden min-w-0 items-center gap-1 sm:flex'">
            <app-icon name="chevron-right" size="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
            @if (last) {
              <span aria-current="page" class="truncate rounded-md px-1.5 py-1 font-medium text-gray-900 dark:text-gray-100">
                {{ crumb.label }}
              </span>
            } @else {
              <a
                [routerLink]="crumb.url"
                class="truncate rounded-md px-1.5 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                {{ crumb.label }}
              </a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbsComponent {
  protected readonly breadcrumbs = inject(BreadcrumbService);
}
