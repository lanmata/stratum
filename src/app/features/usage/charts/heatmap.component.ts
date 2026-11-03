import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HeatCell } from '@shared/models/usage-report.model';
import { CHART, DAY_LABELS, formatInt, heatColor, SLOT_LABELS } from './chart-utils';

const WIDTH = 420;
const LABEL = 34;
const TOP = 18;
const ROW = 24;
const SLOTS = 6;

/** Successful logins by day of the week (rows) and four-hour slot (columns). */
@Component({
  selector: 'app-usage-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="block h-auto w-full" role="img" aria-label="Accesos por día de la semana y franja horaria">
      @for (slot of slotHeaders; track slot.index) {
        <text [attr.x]="labelWidth + slot.index * cellWidth + cellWidth / 2" y="11" text-anchor="middle" font-size="10" [attr.fill]="colors.muted">{{ slot.text }}</text>
      }
      @for (day of dayHeaders; track day.index) {
        <text x="0" [attr.y]="top + day.index * rowHeight + rowHeight / 2 + 3" font-size="11" [attr.fill]="colors.muted">{{ day.text }}</text>
      }
      @for (cell of cells(); track cell.key) {
        <rect [attr.x]="cell.x" [attr.y]="cell.y" [attr.width]="cellWidth - 4" [attr.height]="rowHeight - 3" rx="5" [attr.fill]="cell.fill">
          <title>{{ cell.title }}</title>
        </rect>
        @if (cell.logins > 0) {
          <text [attr.x]="cell.x + (cellWidth - 4) / 2" [attr.y]="cell.y + (rowHeight - 3) / 2 + 3" text-anchor="middle" font-size="10" [attr.fill]="cell.dark ? '#06202C' : colors.ink" pointer-events="none">{{ cell.logins }}</text>
        }
      }
    </svg>
  `,
})
export class HeatmapComponent {
  readonly data = input.required<HeatCell[]>();

  protected readonly width = WIDTH;
  protected readonly labelWidth = LABEL;
  protected readonly top = TOP;
  protected readonly rowHeight = ROW;
  protected readonly cellWidth = (WIDTH - LABEL) / SLOTS;
  protected readonly height = TOP + 7 * ROW + 4;
  protected readonly colors = CHART;
  protected readonly slotHeaders = SLOT_LABELS.map((text, index) => ({ index, text: text.replace(' h', '') }));
  protected readonly dayHeaders = DAY_LABELS.map((text, index) => ({ index, text }));

  protected readonly cells = computed(() => {
    const max = Math.max(0, ...this.data().map((c) => c.logins));
    return this.data().map((c) => ({
      key: `${c.dayOfWeek}-${c.slot}`,
      x: LABEL + c.slot * this.cellWidth,
      y: TOP + (c.dayOfWeek - 1) * ROW,
      logins: c.logins,
      fill: heatColor(c.logins, max),
      dark: max > 0 && c.logins / max > 0.55,
      title: `${DAY_LABELS[c.dayOfWeek - 1]}, ${SLOT_LABELS[c.slot]}: ${formatInt(c.logins)} accesos`,
    }));
  });
}
