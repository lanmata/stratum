import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatInt } from './chart-utils';

export interface BarRow {
  label: string;
  /** Total of the bar. */
  value: number;
  /** Part of the total drawn in the alert colour (failed attempts). */
  alert: number;
  /** Small text under the label. */
  detail: string;
}

/** Horizontal bars, one per application, busiest first. The alert part is drawn at the end of each bar. */
@Component({
  selector: 'app-usage-bar-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-3">
      @for (row of rows(); track row.label) {
        <li class="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3" [attr.title]="row.title">
          <div class="min-w-0">
            <div class="truncate text-sm text-slate-100">{{ row.label }}</div>
            <div class="text-xs text-slate-400">{{ row.detail }}</div>
          </div>
          <div class="flex h-4 items-center gap-0.5" role="img" [attr.aria-label]="row.title">
            <div class="h-full rounded-md bg-gradient-to-r from-cyan-600 to-cyan-400" [style.width.%]="row.mainPercent"></div>
            @if (row.alertPercent > 0) {
              <div class="h-full min-w-1 rounded-md bg-pink-500" [style.width.%]="row.alertPercent"></div>
            }
          </div>
          <div class="w-12 text-right text-sm tabular-nums text-slate-100">{{ row.valueText }}</div>
        </li>
      }
    </ul>
  `,
})
export class BarListComponent {
  readonly data = input.required<BarRow[]>();

  protected readonly rows = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.value));
    return this.data().map((d) => ({
      label: d.label,
      detail: d.detail,
      valueText: formatInt(d.value),
      mainPercent: ((d.value - d.alert) / max) * 100,
      alertPercent: (d.alert / max) * 100,
      title: `${d.label}: ${formatInt(d.value)} eventos, ${formatInt(d.alert)} fallidos. ${d.detail}`,
    }));
  });
}
