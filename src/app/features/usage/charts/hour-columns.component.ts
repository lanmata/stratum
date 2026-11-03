import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HourBucket } from '@shared/models/usage-report.model';
import { axisTicks, CHART, formatInt, pad2 } from './chart-utils';

const WIDTH = 520;
const HEIGHT = 210;
const MARGIN = { left: 34, right: 6, top: 18, bottom: 24 };

/** Successful logins for each hour of the day; the busiest hour is drawn in amber. */
@Component({
  selector: 'app-usage-hour-columns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="block h-auto w-full" role="img" aria-label="Accesos por hora del día">
      <defs>
        <linearGradient id="usage-hour-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" [attr.stop-color]="colors.cyanLight" />
          <stop offset="1" [attr.stop-color]="colors.cyan" stop-opacity=".45" />
        </linearGradient>
        <linearGradient id="usage-hour-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" [attr.stop-color]="colors.amberLight" />
          <stop offset="1" [attr.stop-color]="colors.amber" stop-opacity=".6" />
        </linearGradient>
      </defs>
      @for (tick of ticks(); track tick.value) {
        <line [attr.x1]="margin.left" [attr.x2]="width - margin.right" [attr.y1]="tick.y" [attr.y2]="tick.y" [attr.stroke]="colors.grid" />
        <text [attr.x]="margin.left - 6" [attr.y]="tick.y + 4" text-anchor="end" font-size="11" [attr.fill]="colors.muted">{{ tick.label }}</text>
      }
      @for (bar of bars(); track bar.hour) {
        <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" rx="3" [attr.fill]="bar.peak ? 'url(#usage-hour-amber)' : 'url(#usage-hour-cyan)'">
          <title>{{ bar.range }}: {{ bar.logins }} accesos</title>
        </rect>
        @if (bar.hour % 3 === 0) {
          <text [attr.x]="bar.x + bar.width / 2" [attr.y]="height - 6" text-anchor="middle" font-size="11" [attr.fill]="colors.muted">{{ bar.label }}</text>
        }
        @if (bar.peak) {
          <text [attr.x]="bar.x + bar.width / 2" [attr.y]="bar.y - 5" text-anchor="middle" font-size="11" [attr.fill]="colors.ink">{{ bar.logins }}</text>
        }
      }
    </svg>
  `,
})
export class HourColumnsComponent {
  readonly data = input.required<HourBucket[]>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly margin = MARGIN;
  protected readonly colors = CHART;

  private readonly peak = computed(() => this.data().reduce((best, h) => (h.logins > best.logins ? h : best), { hour: -1, logins: 0 }));
  private readonly top = computed(() => axisTicks(Math.max(1, ...this.data().map((h) => h.logins)), 4)[4]);
  private y(value: number): number {
    return HEIGHT - MARGIN.bottom - ((HEIGHT - MARGIN.top - MARGIN.bottom) * value) / this.top();
  }

  protected readonly ticks = computed(() =>
    axisTicks(Math.max(1, ...this.data().map((h) => h.logins)), 4).map((value) => ({ value, y: this.y(value), label: formatInt(value) })),
  );

  protected readonly bars = computed(() => {
    const n = Math.max(1, this.data().length);
    const slot = (WIDTH - MARGIN.left - MARGIN.right) / n;
    const width = slot * 0.7;
    return this.data().map((h, i) => ({
      hour: h.hour,
      logins: formatInt(h.logins),
      label: pad2(h.hour),
      range: `${pad2(h.hour)}:00 a ${pad2(h.hour)}:59`,
      x: MARGIN.left + slot * i + (slot - width) / 2,
      width,
      y: this.y(h.logins),
      height: Math.max(0, HEIGHT - MARGIN.bottom - this.y(h.logins)),
      peak: h.hour === this.peak().hour && h.logins > 0,
    }));
  });
}
