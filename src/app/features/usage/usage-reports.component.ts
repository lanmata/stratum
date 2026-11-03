import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApplicationService } from '@core/services/application.service';
import { UsageReportService } from '@core/services/usage-report.service';
import { Application } from '@shared/models/application.model';
import { UsageFilters, UsageReportSet } from '@shared/models/usage-report.model';
import { AreaChartComponent } from './charts/area-chart.component';
import { BarListComponent, BarRow } from './charts/bar-list.component';
import { capacityOf, deviceLabel, formatDate, formatDecimal, formatInt, formatPercent } from './charts/chart-utils';
import { ColumnChartComponent } from './charts/column-chart.component';
import { DonutChartComponent, DonutDatum } from './charts/donut-chart.component';
import { HeatmapComponent } from './charts/heatmap.component';
import { HourColumnsComponent } from './charts/hour-columns.component';

export type Preset = '30' | '90' | '180' | '365' | 'custom';

export const PRESETS: { value: Preset; label: string }[] = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último año' },
  { value: 'custom', label: 'Fechas a elegir' },
];

/** `yyyy-MM-dd` of a date in the local time zone. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** First and last day of "the last `days` days", today included. */
export function lastDays(days: number, today: Date = new Date()): { from: string; to: string } {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { from: toIsoDate(start), to: toIsoDate(today) };
}

/**
 * Usage and access reports: how many people use the platform, when and from which kind of client, application by
 * application. Built on the audit trail (backbone `/iam/audit/reports`, feature `AUDIT_READ`).
 */
@Component({
  selector: 'app-usage-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AreaChartComponent, BarListComponent, ColumnChartComponent, DonutChartComponent, HeatmapComponent, HourColumnsComponent],
  template: `
    <div>
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Uso y accesos</h1>
        <p class="mt-1 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Cuántas personas usan la plataforma, cuándo se conectan y desde qué tipo de cliente. Sirve para dimensionarla y decidir su
          alcance. Son cifras agregadas del registro de auditoría: no se muestra ninguna persona ni dirección.
        </p>
      </div>

      <form class="mb-5 flex flex-wrap items-end gap-3" (submit)="$event.preventDefault(); load()">
        <div>
          <label for="usage-preset" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Periodo</label>
          <select id="usage-preset" class="usage-preset rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" [value]="preset()" (change)="onPreset($event)">
            @for (option of presets; track option.value) {
              <option [value]="option.value" [selected]="option.value === preset()">{{ option.label }}</option>
            }
          </select>
        </div>
        @if (preset() === 'custom') {
          <div>
            <label for="usage-from" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Desde</label>
            <input id="usage-from" type="date" class="usage-from rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" [value]="from()" (input)="from.set(value($event))" />
          </div>
          <div>
            <label for="usage-to" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Hasta</label>
            <input id="usage-to" type="date" class="usage-to rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" [value]="to()" (input)="to.set(value($event))" />
          </div>
        }
        <div>
          <label for="usage-app" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Aplicación</label>
          <select id="usage-app" class="usage-app rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" [value]="applicationId()" (change)="applicationId.set(value($event))">
            <option value="" [selected]="applicationId() === ''">Todas</option>
            @for (app of applications(); track app.id) {
              <option [value]="app.id" [selected]="app.id === applicationId()">{{ app.name }}</option>
            }
          </select>
        </div>
        <button type="submit" class="usage-apply rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" [disabled]="loading()">Actualizar</button>
      </form>

      @if (error()) {
        <div role="alert" class="usage-error rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {{ error() }}
          <button type="button" class="usage-retry ml-2 font-medium underline" (click)="load()">Reintentar</button>
        </div>
      } @else if (loading() && !data()) {
        <div class="usage-loading rounded-2xl bg-slate-900 p-10 text-center text-sm text-slate-400" aria-busy="true">Cargando reportes…</div>
      } @else if (data(); as set) {
        <div class="usage-board flex flex-col gap-4 rounded-2xl p-4 sm:p-6" style="background: radial-gradient(900px 420px at 8% -8%, rgba(10,159,191,.22), transparent 60%), radial-gradient(800px 420px at 100% 0%, rgba(139,92,246,.20), transparent 60%), radial-gradient(700px 500px at 60% 110%, rgba(236,72,153,.14), transparent 60%), #0B1220; color: #E6EDF7;" [class.opacity-60]="loading()">
          <p class="usage-period text-sm text-slate-300">
            Del <b class="text-slate-100">{{ date(set.summary.from) }}</b> al <b class="text-slate-100">{{ date(set.summary.to) }}</b>:
            <b class="text-slate-100">{{ int(set.summary.events) }}</b> eventos de
            <b class="text-slate-100">{{ int(set.summary.activeUsers) }}</b> personas en
            <b class="text-slate-100">{{ int(set.summary.applications) }}</b> aplicaciones.
          </p>

          <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicadores principales">
            <div class="usage-tile rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-4 text-white">
              <div class="text-xs uppercase tracking-wide opacity-90">Accesos exitosos</div>
              <div class="mt-1 text-4xl font-light tabular-nums" style="font-family: var(--font-anthropic-serif, serif)">{{ int(set.summary.logins) }}</div>
              <div class="text-xs opacity-90">{{ int(set.summary.logouts) }} cierres de sesión</div>
            </div>
            <div class="usage-tile rounded-2xl bg-gradient-to-br from-violet-500 to-violet-800 p-4 text-white">
              <div class="text-xs uppercase tracking-wide opacity-90">Personas activas</div>
              <div class="mt-1 text-4xl font-light tabular-nums" style="font-family: var(--font-anthropic-serif, serif)">{{ int(set.summary.activeUsers) }}</div>
              <div class="text-xs opacity-90">{{ decimal(capacity().loginsPerUser) }} accesos por persona</div>
            </div>
            <div class="usage-tile rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-4 text-white">
              <div class="text-xs uppercase tracking-wide opacity-90">Aplicaciones con actividad</div>
              <div class="mt-1 text-4xl font-light tabular-nums" style="font-family: var(--font-anthropic-serif, serif)">{{ appsWithActivity() }}</div>
              <div class="text-xs opacity-90">de {{ set.applications.length }} registradas</div>
            </div>
            <div class="usage-tile rounded-2xl bg-gradient-to-br from-pink-500 to-pink-800 p-4 text-white">
              <div class="text-xs uppercase tracking-wide opacity-90">Intentos fallidos</div>
              <div class="mt-1 text-4xl font-light tabular-nums" style="font-family: var(--font-anthropic-serif, serif)">{{ percent(set.summary.failureRate) }}</div>
              <div class="text-xs opacity-90">{{ int(set.summary.failures) }} de {{ int(set.summary.logins + set.summary.failures) }} intentos</div>
            </div>
          </section>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-8">
              <h2 class="text-base font-semibold">Accesos por semana</h2>
              <p class="mb-2 text-xs text-slate-400">
                <i class="mr-1 inline-block h-2 w-2 rounded-sm bg-cyan-600"></i>Accesos exitosos
                <i class="ml-3 mr-1 inline-block h-2 w-2 rounded-sm bg-pink-500"></i>Intentos fallidos
              </p>
              <app-usage-area-chart [points]="set.weekly" />
            </section>
            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-4">
              <h2 class="text-base font-semibold">Quién se conecta</h2>
              <p class="mb-3 text-xs text-slate-400">Tipo de cliente declarado en cada evento.</p>
              <app-usage-donut-chart [data]="donut()" />
            </section>

            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-7">
              <h2 class="text-base font-semibold">Actividad por aplicación</h2>
              <p class="mb-3 text-xs text-slate-400">Eventos del periodo. En magenta, los intentos fallidos.</p>
              <app-usage-bar-list [data]="bars()" />
            </section>
            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-5">
              <h2 class="text-base font-semibold">Dimensionamiento</h2>
              <p class="mb-3 text-xs text-slate-400">Calculado con las series de este periodo.</p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="usage-capacity rounded-xl border border-slate-700/60 p-3"><b class="block text-2xl font-light tabular-nums">{{ decimal(capacity().averagePerActiveWeek) }}</b><span class="text-xs text-slate-400">accesos por semana con actividad</span></div>
                <div class="usage-capacity rounded-xl border border-slate-700/60 p-3"><b class="block text-2xl font-light tabular-nums">{{ int(capacity().peakWeekLogins) }}</b><span class="text-xs text-slate-400">accesos en la semana pico{{ capacity().peakWeek ? ', la del ' + date(capacity().peakWeek) : '' }}</span></div>
                <div class="usage-capacity rounded-xl border border-slate-700/60 p-3"><b class="block text-2xl font-light tabular-nums">{{ capacity().peakHour }}</b><span class="text-xs text-slate-400">hora con más accesos (hora del servidor)</span></div>
                <div class="usage-capacity rounded-xl border border-slate-700/60 p-3"><b class="block text-2xl font-light tabular-nums">{{ percent(capacity().activeWeeksShare, 0) }}</b><span class="text-xs text-slate-400">de las semanas tuvo actividad</span></div>
              </div>
            </section>

            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-7">
              <h2 class="text-base font-semibold">Accesos por hora del día</h2>
              <p class="mb-2 text-xs text-slate-400">Suma del periodo; la barra ámbar es la hora pico.</p>
              <app-usage-hour-columns [data]="set.hours" />
            </section>
            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-5">
              <h2 class="text-base font-semibold">Día de la semana y franja</h2>
              <p class="mb-2 text-xs text-slate-400">Franjas de cuatro horas.</p>
              <app-usage-heatmap [data]="set.heatmap" />
            </section>

            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-5">
              <h2 class="text-base font-semibold">Accesos por mes</h2>
              <p class="mb-2 text-xs text-slate-400">El mes en curso puede estar incompleto.</p>
              <app-usage-column-chart [points]="set.monthly" />
            </section>
            <section class="usage-card rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 lg:col-span-7">
              <h2 class="text-base font-semibold">Alcance por aplicación</h2>
              <p class="mb-2 text-xs text-slate-400">Personas registradas frente a las que aparecen con accesos, y roles definidos.</p>
              <div class="overflow-x-auto">
                <table class="usage-table w-full border-collapse text-sm tabular-nums">
                  <thead>
                    <tr class="text-xs text-slate-400">
                      <th class="p-2 text-left font-medium">Aplicación</th>
                      <th class="p-2 text-right font-medium">Registradas</th>
                      <th class="p-2 text-right font-medium">Con accesos</th>
                      <th class="p-2 text-right font-medium">Roles</th>
                      <th class="p-2 text-right font-medium">Eventos</th>
                      <th class="p-2 text-right font-medium">Fallos</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (app of set.applications; track app.applicationId ?? 'none') {
                      <tr class="border-t border-slate-700/40">
                        <td class="p-2 text-left">{{ app.applicationName ?? 'Sin aplicación' }}</td>
                        <td class="p-2 text-right">{{ int(app.registeredUsers) }}</td>
                        <td class="p-2 text-right">{{ int(app.activeUsers) }}</td>
                        <td class="p-2 text-right">{{ int(app.roles) }}</td>
                        <td class="p-2 text-right">{{ int(app.events) }}</td>
                        <td class="p-2 text-right">{{ int(app.failures) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          @if (mostlyApiClients()) {
            <p role="note" class="usage-note rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              La mayoría de los eventos llega de clientes de API o del servidor intermedio, no de navegadores. Para ver dispositivos y
              navegadores reales, el servidor de Stratum debe reenviar el navegador de cada persona y backbone debe confiar en él
              (<code>UMDC_AUDIT_TRUSTED_PROXIES</code>).
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class UsageReportsComponent implements OnInit {
  private readonly reports = inject(UsageReportService);
  private readonly applicationService = inject(ApplicationService);

  protected readonly presets = PRESETS;
  protected readonly preset = signal<Preset>('90');
  protected readonly from = signal(lastDays(90).from);
  protected readonly to = signal(lastDays(90).to);
  protected readonly applicationId = signal('');
  protected readonly applications = signal<Application[]>([]);

  protected readonly data = signal<UsageReportSet | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly capacity = computed(() => {
    const set = this.data();
    return set ? capacityOf(set) : capacityOf({ summary: EMPTY_SUMMARY, weekly: [], hours: [] });
  });

  protected readonly appsWithActivity = computed(() => (this.data()?.applications ?? []).filter((a) => a.events > 0).length);

  protected readonly donut = computed<DonutDatum[]>(() =>
    (this.data()?.clients ?? []).map((c) => ({ label: deviceLabel(c.deviceClass, c.browser), value: c.events })),
  );

  protected readonly bars = computed<BarRow[]>(() =>
    (this.data()?.applications ?? []).map((a) => ({
      label: a.applicationName ?? 'Sin aplicación',
      value: a.events,
      alert: a.failures,
      detail: `${formatInt(a.activeUsers)} con accesos · ${formatInt(a.registeredUsers)} registradas · ${formatInt(a.roles)} roles`,
    })),
  );

  /** True when more than half of the events come from programs calling the API instead of browsers. */
  protected readonly mostlyApiClients = computed(() => {
    const clients = this.data()?.clients ?? [];
    const total = clients.reduce((sum, c) => sum + c.events, 0);
    const api = clients.filter((c) => c.deviceClass === 'API_CLIENT').reduce((sum, c) => sum + c.events, 0);
    return total > 0 && api / total > 0.5;
  });

  protected readonly int = formatInt;
  protected readonly decimal = (value: number) => formatDecimal(value, 1);
  protected readonly percent = (value: number, digits = 1) => formatPercent(value, digits);
  protected readonly date = (iso: string | null) => formatDate(iso);

  ngOnInit(): void {
    this.applicationService.getAll().subscribe({
      next: (apps) => this.applications.set(apps),
      error: () => this.applications.set([]),
    });
    this.load();
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected onPreset(event: Event): void {
    const preset = this.value(event) as Preset;
    this.preset.set(preset);
    if (preset !== 'custom') {
      const range = lastDays(Number(preset));
      this.from.set(range.from);
      this.to.set(range.to);
      this.load();
    }
  }

  load(): void {
    const filters: UsageFilters = { applicationId: this.applicationId(), from: this.from(), to: this.to() };
    this.loading.set(true);
    this.error.set('');
    this.reports.all(filters).subscribe({
      next: (set) => {
        this.data.set(set);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        this.error.set(
          err?.status === 400
            ? 'El periodo no es válido: la fecha inicial debe ser anterior a la final y el periodo no puede pasar de dos años.'
            : 'No se pudieron cargar los reportes.',
        );
      },
    });
  }
}

const EMPTY_SUMMARY = {
  from: '',
  to: '',
  events: 0,
  logins: 0,
  failures: 0,
  logouts: 0,
  passwordChanges: 0,
  otherEvents: 0,
  activeUsers: 0,
  sourceIps: 0,
  applications: 0,
  failureRate: 0,
  firstEvent: null,
  lastEvent: null,
};
