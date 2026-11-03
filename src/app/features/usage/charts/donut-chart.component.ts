import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { arcPath, CHART, donutSlices, formatInt, formatPercent } from './chart-utils';

export interface DonutDatum {
  label: string;
  value: number;
}

const SIZE = 180;
const COLORS = [CHART.cyan, CHART.violet, CHART.amber, CHART.pink, CHART.cyanLight, CHART.amberLight];

/** Share of events by kind of client. The centre shows the total, or the slice under the pointer. */
@Component({
  selector: 'app-usage-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
      <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="h-44 w-44 shrink-0" role="img" [attr.aria-label]="'Total ' + total() + ' eventos'">
        @for (slice of slices(); track slice.index) {
          <path
            [attr.d]="slice.path"
            [attr.fill]="slice.color"
            [attr.opacity]="active() === null || active() === slice.index ? 1 : 0.35"
            (pointerenter)="active.set(slice.index)"
            (pointerleave)="active.set(null)"
          >
            <title>{{ slice.label }}: {{ slice.valueText }} ({{ slice.percentText }})</title>
          </path>
        }
        <text [attr.x]="size / 2" [attr.y]="size / 2 + 2" text-anchor="middle" font-size="28" [attr.fill]="colors.ink" style="font-family: var(--font-anthropic-serif, serif)">{{ centre().value }}</text>
        <text [attr.x]="size / 2" [attr.y]="size / 2 + 20" text-anchor="middle" font-size="11" [attr.fill]="colors.muted">{{ centre().caption }}</text>
      </svg>
      <ul class="flex min-w-0 flex-col gap-2 text-sm text-slate-200">
        @for (slice of slices(); track slice.index) {
          <li class="flex items-center gap-2">
            <i class="h-2.5 w-2.5 shrink-0 rounded-sm" [style.background]="slice.color"></i>
            <span class="truncate">{{ slice.label }}</span>
            <span class="ml-auto pl-3 tabular-nums text-slate-400">{{ slice.valueText }} · {{ slice.percentText }}</span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class DonutChartComponent {
  readonly data = input.required<DonutDatum[]>();

  protected readonly size = SIZE;
  protected readonly colors = CHART;
  protected readonly active = signal<number | null>(null);

  protected readonly total = computed(() => this.data().reduce((sum, d) => sum + Math.max(0, d.value), 0));

  protected readonly slices = computed(() =>
    donutSlices(this.data().map((d) => d.value)).map((slice) => ({
      index: slice.index,
      label: this.data()[slice.index].label,
      color: COLORS[slice.index % COLORS.length],
      path: arcPath(SIZE / 2, SIZE / 2, SIZE / 2 - 2, SIZE / 2 - 26, slice.start, slice.end),
      valueText: formatInt(slice.value),
      percentText: formatPercent(slice.fraction, 0),
    })),
  );

  protected readonly centre = computed(() => {
    const i = this.active();
    const d = i === null ? undefined : this.data()[i];
    return d ? { value: formatInt(d.value), caption: d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label } : { value: formatInt(this.total()), caption: 'eventos' };
  });
}
