import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApplicationService } from '@core/services/application.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { PersonService } from '@core/services/person.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { IconComponent, IconName } from '@shared/components/icon/icon.component';
import { NAV_GROUPS, QUICK_ACTIONS } from '@shared/layout/nav-items';

interface Stat {
  key: string;
  label: string;
  path: string;
  icon: IconName;
  accent: string;
}

const STATS: Stat[] = [
  { key: 'applications', label: 'Aplicaciones', path: '/applications', icon: 'apps', accent: 'from-blue-500 to-indigo-600' },
  { key: 'people', label: 'Personas', path: '/people', icon: 'users', accent: 'from-emerald-500 to-teal-600' },
  { key: 'contactTypes', label: 'Tipos de contacto', path: '/contact-types', icon: 'tag', accent: 'from-violet-500 to-purple-600' },
  { key: 'serviceTypes', label: 'Tipos de servicio', path: '/service-types', icon: 'cog', accent: 'from-sky-500 to-cyan-600' },
  { key: 'noticeTypes', label: 'Tipos de aviso', path: '/notice-types', icon: 'megaphone', accent: 'from-rose-500 to-pink-600' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="space-y-8">
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-10">
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
        <div class="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl"></div>
        <div class="relative">
          <p class="text-sm font-medium text-blue-100 first-letter:uppercase">{{ today }}</p>
          <h1 class="mt-1 text-2xl font-semibold sm:text-3xl">{{ greeting }}, {{ firstName() }}</h1>
          <p class="mt-2 max-w-xl text-sm text-blue-100">
            Administra aplicaciones, personas y catálogos desde un solo lugar. Usa
            <kbd class="rounded bg-white/20 px-1.5 py-0.5 text-xs font-medium">Ctrl K</kbd>
            para saltar a cualquier sección.
          </p>
          <div class="mt-6 flex flex-wrap gap-2">
            @for (action of quickActions; track action.path) {
              <a
                [routerLink]="action.path"
                class="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
              >
                <app-icon [name]="action.icon" size="h-4 w-4" />
                {{ action.label }}
              </a>
            }
          </div>
        </div>
      </section>

      <section aria-label="Resumen">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
          @for (stat of stats; track stat.key) {
            <a
              [routerLink]="stat.path"
              class="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div [class]="'mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ' + stat.accent">
                <app-icon [name]="stat.icon" size="h-5 w-5" />
              </div>
              @if (counts()[stat.key] === undefined) {
                <div class="skeleton h-7 w-12 rounded-md"></div>
              } @else {
                <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ counts()[stat.key] ?? '—' }}</p>
              }
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
            </a>
          }
        </div>
      </section>

      @for (group of groups; track group.name) {
        <section>
          <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ group.name }}</h2>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (item of group.items; track item.path) {
              <a
                [routerLink]="item.path"
                class="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/60"
              >
                <div [class]="'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-110 ' + item.accent">
                  <app-icon [name]="item.icon" size="h-6 w-6" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ item.label }}</p>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</p>
                </div>
                <app-icon
                  name="arrow-right"
                  size="h-4 w-4"
                  class="mt-1 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-gray-600"
                />
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(SessionStoreService);
  private readonly applications = inject(ApplicationService);
  private readonly people = inject(PersonService);
  private readonly contactTypes = inject(ContactTypeService);
  private readonly serviceTypes = inject(ServiceTypeService);
  private readonly noticeTypes = inject(NoticeTypeService);

  protected readonly groups = NAV_GROUPS;
  protected readonly quickActions = QUICK_ACTIONS.slice(0, 3);
  protected readonly stats = STATS;
  protected readonly counts = signal<Record<string, number | null>>({});

  private readonly user = toSignal(this.store.user$, { initialValue: null });
  protected readonly firstName = computed(
    () => this.user()?.displayName?.split(/\s+/)[0] || 'bienvenido',
  );

  protected readonly today = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  protected readonly greeting = greetingFor(new Date().getHours());

  ngOnInit(): void {
    this.load('applications', this.applications.getAll());
    this.load('people', this.people.getAll());
    this.load('contactTypes', this.contactTypes.getAll());
    this.load('serviceTypes', this.serviceTypes.getAll());
    this.load('noticeTypes', this.noticeTypes.getAll());
  }

  private load(key: string, source: Observable<unknown[]>): void {
    source
      .pipe(
        map((list) => list.length),
        catchError(() => of(null)),
      )
      .subscribe((count) => this.counts.update((c) => ({ ...c, [key]: count })));
  }
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
