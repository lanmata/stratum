import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UsagePoint } from '@shared/models/usage-report.model';
import { CHART, formatInt, formatMonth, MONTHS } from './chart-utils';

const WIDTH = 360;
const HEIGHT = 210;
const MARGIN = { left: 8, right: 8, top: 20, bottom: 24 };

/** Logins per month as columns, with failed attempts stacked on top in pink. */
@Component({
  selector: 'app-usage-column-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="block h-auto w-full" role="img" aria-label="Accesos por mes">
      <defs>
        <linearGradient id="usage-month-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" [attr.stop-color]="colors.cyanLight" />
          <stop offset="1" [attr.stop-color]="colors.cyan" stop-opacity=".5" />
        </linearGradient>
      </defs>
      @for (col of columns(); track col.period) {
        <rect [attr.x]="col.x" [attr.y]="col.loginY" [attr.width]="col.width" [attr.height]="col.loginHeight" rx="5" fill="url(#usage-month-cyan)">
          <title>{{ col.title }}</title>
        </rect>
        @if (col.failureHeight > 0) {
          <rect [attr.x]="col.x" [attr.y]="col.failureY" [attr.width]="col.width" [attr.height]="col.failureHeight" rx="3" [attr.fill]="colors.pink">
            <title>{{ col.title }}</title>
          </rect>
        }
        <text [attr.x]="col.x + col.width / 2" [attr.y]="col.labelY" text-anchor="middle" font-size="11" [attr.fill]="colors.ink">{{ col.logins }}</text>
        <text [attr.x]="col.x + col.width / 2" [attr.y]="height - 6" text-anchor="middle" font-size="11" [attr.fill]="colors.muted">{{ col.month }}</text>
      }
    </svg>
  `,
})
export class ColumnChartComponent {
  readonly points = input.required<UsagePoint[]>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly colors = CHART;

  protected readonly columns = computed(() => {
    const n = Math.max(1, this.points().length);
    const slot = (WIDTH - MARGIN.left - MARGIN.right) / n;
    const width = slot * 0.62;
    const max = Math.max(1, ...this.points().map((p) => p.logins + p.failures));
    const scale = (HEIGHT - MARGIN.top - MARGIN.bottom) / max;
    const base = HEIGHT - MARGIN.bottom;
    return this.points().map((p, i) => {
      const loginHeight = p.logins * scale;
      const failureHeight = p.failures > 0 ? Math.max(3, p.failures * scale - 2) : 0;
      const top = base - loginHeight - (failureHeight > 0 ? failureHeight + 2 : 0);
      return {
        period: p.period,
        month: MONTHS[Number(p.period.slice(5, 7)) - 1] ?? p.period,
        logins: formatInt(p.logins),
        x: MARGIN.left + slot * i + (slot - width) / 2,
        width,
        loginY: base - loginHeight,
        loginHeight,
        failureY: base - loginHeight - failureHeight - 2,
        failureHeight,
        labelY: top - 5,
        title: `${formatMonth(p.period)}: ${formatInt(p.logins)} accesos, ${formatInt(p.failures)} fallidos, ${formatInt(p.activeUsers)} personas`,
      };
    });
  });
}
