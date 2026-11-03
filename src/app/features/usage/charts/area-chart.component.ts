import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { UsagePoint } from '@shared/models/usage-report.model';
import { areaPath, axisTicks, CHART, formatDate, formatInt, linePath, MONTHS } from './chart-utils';

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { left: 38, right: 12, top: 12, bottom: 28 };

/** Logins over time as a gradient area, with failed attempts as pink columns. Hover shows the bucket. */
@Component({
  selector: 'app-usage-area-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <svg
        [attr.viewBox]="'0 0 ' + width + ' ' + height"
        class="block h-auto w-full"
        role="img"
        [attr.aria-label]="'Accesos por semana: ' + points().length + ' puntos'"
      >
        <defs>
          <linearGradient id="usage-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" [attr.stop-color]="colors.cyan" stop-opacity=".55" />
            <stop offset="1" [attr.stop-color]="colors.cyan" stop-opacity=".02" />
          </linearGradient>
        </defs>
        @for (tick of yTicks(); track tick.value) {
          <line [attr.x1]="margin.left" [attr.x2]="width - margin.right" [attr.y1]="tick.y" [attr.y2]="tick.y" [attr.stroke]="colors.grid" />
          <text [attr.x]="margin.left - 6" [attr.y]="tick.y + 4" text-anchor="end" font-size="11" [attr.fill]="colors.muted">{{ tick.label }}</text>
        }
        <path [attr.d]="area()" fill="url(#usage-area-fill)" />
        <path [attr.d]="line()" fill="none" [attr.stroke]="colors.cyan" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        @for (bar of failureBars(); track bar.index) {
          <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" rx="2" [attr.fill]="colors.pink" />
        }
        @for (label of xLabels(); track label.index) {
          <text [attr.x]="label.x" [attr.y]="height - 8" [attr.text-anchor]="label.anchor" font-size="11" [attr.fill]="colors.muted">{{ label.text }}</text>
        }
        @if (hovered(); as h) {
          <line [attr.x1]="h.x" [attr.x2]="h.x" [attr.y1]="margin.top" [attr.y2]="height - margin.bottom" [attr.stroke]="colors.muted" stroke-dasharray="3 3" />
          <circle [attr.cx]="h.x" [attr.cy]="h.y" r="5" [attr.fill]="colors.cyan" stroke="#0B1220" stroke-width="2" />
        }
        <rect
          class="usage-area-hit"
          [attr.x]="margin.left"
          [attr.y]="margin.top"
          [attr.width]="width - margin.left - margin.right"
          [attr.height]="height - margin.top - margin.bottom"
          fill="transparent"
          (pointermove)="move($event)"
          (pointerleave)="hover.set(null)"
        />
      </svg>
      @if (hovered(); as h) {
        <div
          class="usage-tooltip pointer-events-none absolute z-10 min-w-36 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-xl"
          [style.left.%]="h.leftPercent"
          [style.top.px]="8"
          [style.transform]="h.leftPercent > 60 ? 'translateX(-105%)' : 'translateX(8px)'"
        >
          <div class="mb-1 text-slate-400">Semana del {{ h.date }}</div>
          <div class="flex justify-between gap-4"><span><i class="mr-1.5 inline-block h-2 w-2 rounded-sm" style="background:#0A9FBF"></i>Accesos</span><b>{{ h.logins }}</b></div>
          <div class="flex justify-between gap-4"><span><i class="mr-1.5 inline-block h-2 w-2 rounded-sm" style="background:#EC4899"></i>Fallidos</span><b>{{ h.failures }}</b></div>
          <div class="flex justify-between gap-4"><span>Personas activas</span><b>{{ h.users }}</b></div>
        </div>
      }
    </div>
  `,
})
export class AreaChartComponent {
  readonly points = input.required<UsagePoint[]>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly margin = MARGIN;
  protected readonly colors = CHART;
  protected readonly hover = signal<number | null>(null);

  private readonly max = computed(() => Math.max(1, ...this.points().map((p) => p.logins), ...this.points().map((p) => p.failures)));
  private readonly top = computed(() => axisTicks(this.max())[4]);

  private readonly xs = computed(() => {
    const n = this.points().length;
    const span = WIDTH - MARGIN.left - MARGIN.right;
    return this.points().map((_, i) => MARGIN.left + (n === 1 ? span / 2 : (span * i) / (n - 1)));
  });

  private y(value: number): number {
    return HEIGHT - MARGIN.bottom - ((HEIGHT - MARGIN.top - MARGIN.bottom) * value) / this.top();
  }

  protected readonly yTicks = computed(() =>
    axisTicks(this.max()).map((value) => ({ value, y: this.y(value), label: formatInt(value) })),
  );

  private readonly coords = computed(() => this.points().map((p, i) => ({ x: this.xs()[i], y: this.y(p.logins) })));
  protected readonly line = computed(() => linePath(this.coords()));
  protected readonly area = computed(() => areaPath(this.coords(), HEIGHT - MARGIN.bottom));

  protected readonly failureBars = computed(() => {
    const n = this.points().length;
    const width = Math.max(3, Math.min(9, ((WIDTH - MARGIN.left - MARGIN.right) / Math.max(n, 1)) * 0.4));
    return this.points()
      .map((p, index) => ({ p, index }))
      .filter(({ p }) => p.failures > 0)
      .map(({ p, index }) => ({
        index,
        x: this.xs()[index] - width / 2,
        y: this.y(p.failures),
        width,
        height: HEIGHT - MARGIN.bottom - this.y(p.failures),
      }));
  });

  /** A label where the month changes, so the axis never gets crowded. */
  protected readonly xLabels = computed(() => {
    const labels: { index: number; x: number; text: string; anchor: 'start' | 'end' }[] = [];
    let lastMonth = '';
    this.points().forEach((p, index) => {
      const month = p.period.slice(0, 7);
      if (month !== lastMonth) {
        lastMonth = month;
        const x = this.xs()[index];
        // A label that would run past the right edge is anchored at its end instead of being cut.
        labels.push({ index, x, text: MONTHS[Number(p.period.slice(5, 7)) - 1] ?? p.period, anchor: x > WIDTH - MARGIN.right - 28 ? 'end' : 'start' });
      }
    });
    return labels;
  });

  protected readonly hovered = computed(() => {
    const i = this.hover();
    const p = i === null ? undefined : this.points()[i];
    if (i === null || !p) return null;
    return {
      x: this.xs()[i],
      y: this.y(p.logins),
      leftPercent: (this.xs()[i] / WIDTH) * 100,
      date: formatDate(p.period),
      logins: formatInt(p.logins),
      failures: formatInt(p.failures),
      users: formatInt(p.activeUsers),
    };
  });

  protected move(event: PointerEvent): void {
    const target = event.currentTarget as SVGRectElement;
    const rect = target.getBoundingClientRect();
    const n = this.points().length;
    if (n === 0 || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.hover.set(n === 1 ? 0 : Math.round(ratio * (n - 1)));
  }
}
