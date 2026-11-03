import { UsageReportSet } from '@shared/models/usage-report.model';

/** Chart palette, validated for colour-blind separation and contrast on the dark panel (`#0B1220`). */
export const CHART = {
  cyan: '#0A9FBF',
  cyanLight: '#38C8E8',
  violet: '#8B5CF6',
  amber: '#CF7F0A',
  amberLight: '#E8A33A',
  pink: '#EC4899',
  ink: '#E6EDF7',
  muted: '#8FA3BF',
  grid: 'rgba(143,163,191,.16)',
} as const;

export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const SLOT_LABELS = ['0–3 h', '4–7 h', '8–11 h', '12–15 h', '16–19 h', '20–23 h'];

export interface Point {
  x: number;
  y: number;
}

const nf = new Intl.NumberFormat('es');

export function formatInt(value: number): string {
  return nf.format(value);
}

export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat('es', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${formatDecimal(fraction * 100, digits)} %`;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** `2026-10-05` → `5 oct 2026`; anything that is not a date is returned as it came. */
export function formatDate(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return iso ?? '—';
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

/** `2026-10-01` → `oct 2026`. */
export function formatMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : iso;
}

/** Smallest "nice" number (1, 2, 2.5, 5 or 10 times a power of ten) that is not below `value`; 1 for zero or less. */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const nice = [1, 2, 2.5, 5, 10].find((step) => fraction <= step + 1e-9) ?? 10;
  return nice * magnitude;
}

/** Axis ticks from 0 up to a nice maximum that covers `max`, `count` intervals. */
export function axisTicks(max: number, count = 4): number[] {
  const top = niceCeil(max);
  return Array.from({ length: count + 1 }, (_, i) => (top * i) / count);
}

export function linePath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)},${round(p.y)}`).join(' ');
}

export function areaPath(points: Point[], baseline: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Point on a circle; the angle is in radians, 0 at 12 o'clock and growing clockwise. */
export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return { x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) };
}

/** Path of a ring segment between two angles. */
export function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number): string {
  const large = end - start > Math.PI ? 1 : 0;
  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, end);
  const i2 = polar(cx, cy, inner, end);
  const i1 = polar(cx, cy, inner, start);
  return (
    `M${round(o1.x)},${round(o1.y)} A${outer},${outer} 0 ${large} 1 ${round(o2.x)},${round(o2.y)} ` +
    `L${round(i2.x)},${round(i2.y)} A${inner},${inner} 0 ${large} 0 ${round(i1.x)},${round(i1.y)} Z`
  );
}

export interface Slice {
  index: number;
  value: number;
  fraction: number;
  start: number;
  end: number;
}

/** Angles of a donut for the given values, leaving `gap` radians between slices; empty slices are dropped. */
export function donutSlices(values: number[], gap = 0.04): Slice[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total === 0) return [];
  const used = values.filter((v) => v > 0).length;
  const room = 2 * Math.PI - (used > 1 ? gap * used : 0);
  const slices: Slice[] = [];
  let angle = 0;
  values.forEach((value, index) => {
    if (value <= 0) return;
    const fraction = value / total;
    const sweep = fraction * room;
    slices.push({ index, value, fraction, start: angle, end: angle + sweep });
    angle += sweep + (used > 1 ? gap : 0);
  });
  return slices;
}

function hex(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Colour at `t` (0 to 1) between two `#rrggbb` colours. */
export function lerpColor(from: string, to: string, t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const [r1, g1, b1] = hex(from);
  const [r2, g2, b2] = hex(to);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * clamped);
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
}

/** Heat-map colour: one hue, from the panel colour (no logins) up to light cyan (the busiest cell). */
export function heatColor(value: number, max: number): string {
  return value <= 0 || max <= 0 ? 'rgba(143, 163, 191, 0.08)' : lerpColor('#16304A', '#3FD2F0', value / max);
}

export function deviceLabel(deviceClass: string, browser: string): string {
  const device: Record<string, string> = {
    DESKTOP_BROWSER: 'Navegador de escritorio',
    MOBILE_BROWSER: 'Navegador móvil',
    API_CLIENT: 'Cliente de API o BFF',
    OTHER: 'Otro',
    UNKNOWN: 'Sin dato',
  };
  const browsers: Record<string, string> = {
    CHROME: 'Chrome',
    SAFARI: 'Safari',
    FIREFOX: 'Firefox',
    EDGE: 'Edge',
    OPERA: 'Opera',
  };
  const label = device[deviceClass] ?? deviceClass;
  return browsers[browser] ? `${label} · ${browsers[browser]}` : label;
}

/** Figures the capacity panel shows, worked out from the series the page already has. */
export interface Capacity {
  averagePerActiveWeek: number;
  peakWeek: string | null;
  peakWeekLogins: number;
  peakHour: string;
  peakHourLogins: number;
  loginsPerUser: number;
  activeWeeksShare: number;
}

export function capacityOf(set: Pick<UsageReportSet, 'summary' | 'weekly' | 'hours'>): Capacity {
  const active = set.weekly.filter((w) => w.logins > 0);
  const total = active.reduce((sum, w) => sum + w.logins, 0);
  const peakWeek = set.weekly.reduce((best, w) => (w.logins > best.logins ? w : best), { logins: 0, period: '' });
  const peakHour = set.hours.reduce((best, h) => (h.logins > best.logins ? h : best), { hour: 0, logins: 0 });
  return {
    averagePerActiveWeek: active.length ? total / active.length : 0,
    peakWeek: peakWeek.logins > 0 ? peakWeek.period : null,
    peakWeekLogins: peakWeek.logins,
    peakHour: `${pad2(peakHour.hour)}:00`,
    peakHourLogins: peakHour.logins,
    loginsPerUser: set.summary.activeUsers ? set.summary.logins / set.summary.activeUsers : 0,
    activeWeeksShare: set.weekly.length ? active.length / set.weekly.length : 0,
  };
}
