import { UsageSummary } from '@shared/models/usage-report.model';
import {
  areaPath,
  arcPath,
  axisTicks,
  capacityOf,
  deviceLabel,
  donutSlices,
  formatDate,
  formatDecimal,
  formatInt,
  formatMonth,
  formatPercent,
  heatColor,
  lerpColor,
  linePath,
  niceCeil,
  pad2,
  polar,
} from './chart-utils';

const summary = (extra: Partial<UsageSummary> = {}): UsageSummary => ({
  from: '2026-10-01',
  to: '2026-10-31',
  events: 10,
  logins: 8,
  failures: 1,
  logouts: 1,
  passwordChanges: 0,
  otherEvents: 0,
  activeUsers: 4,
  sourceIps: 2,
  applications: 2,
  failureRate: 0.11,
  firstEvent: null,
  lastEvent: null,
  ...extra,
});

describe('formatting', () => {
  it('formats numbers in Spanish', () => {
    expect(formatInt(1234567)).toMatch(/^1.234.567$/);
    expect(formatDecimal(2.456, 1)).toBe('2,5');
    expect(formatDecimal(2)).toBe('2,0');
    expect(formatPercent(0.0763)).toBe('7,6 %');
    expect(formatPercent(0.5, 0)).toBe('50 %');
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });

  it('formats dates and months, and returns what is not a date', () => {
    expect(formatDate('2026-10-05')).toBe('5 oct 2026');
    expect(formatDate('2026-01-31T10:00:00')).toBe('31 ene 2026');
    expect(formatDate('soon')).toBe('soon');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatMonth('2026-06-01')).toBe('jun 2026');
    expect(formatMonth('x')).toBe('x');
  });
});

describe('axis', () => {
  it('rounds up to a nice number', () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(-5)).toBe(1);
    expect(niceCeil(1)).toBe(1);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(7)).toBe(10);
    expect(niceCeil(88)).toBe(100);
    expect(niceCeil(2.2)).toBe(2.5);
    expect(niceCeil(1200)).toBe(2000);
  });

  it('builds ticks from zero to a nice maximum', () => {
    expect(axisTicks(88)).toEqual([0, 25, 50, 75, 100]);
    expect(axisTicks(8, 2)).toEqual([0, 5, 10]);
    expect(axisTicks(0)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe('paths', () => {
  it('draws a line and a closed area', () => {
    const points = [{ x: 0, y: 10 }, { x: 5.123, y: 4 }];
    expect(linePath(points)).toBe('M0,10 L5.12,4');
    expect(areaPath(points, 20)).toBe('M0,10 L5.12,4 L5.12,20 L0,20 Z');
    expect(linePath([])).toBe('');
    expect(areaPath([], 20)).toBe('');
  });

  it('places points on a circle clockwise from 12 o\'clock', () => {
    const top = polar(50, 50, 10, 0);
    const right = polar(50, 50, 10, Math.PI / 2);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(40);
    expect(right.x).toBeCloseTo(60);
    expect(right.y).toBeCloseTo(50);
  });

  it('draws a ring segment, flagging the large arc', () => {
    expect(arcPath(50, 50, 40, 20, 0, Math.PI / 2)).toContain(' 0 0 1 ');
    expect(arcPath(50, 50, 40, 20, 0, Math.PI * 1.5)).toContain(' 0 1 1 ');
    expect(arcPath(50, 50, 40, 20, 0, 1)).toMatch(/^M[\d.,-]+ A40,40 .* Z$/);
  });
});

describe('donutSlices', () => {
  it('splits the circle in proportion, with a gap between slices', () => {
    const slices = donutSlices([75, 25], 0.1);
    expect(slices.length).toBe(2);
    expect(slices[0].fraction).toBeCloseTo(0.75);
    expect(slices[1].start).toBeCloseTo(slices[0].end + 0.1);
    expect(slices[1].end).toBeCloseTo(2 * Math.PI - 0.1);
  });

  it('drops empty slices, keeps the original index and leaves no gap for a single slice', () => {
    const slices = donutSlices([0, 10, -3]);
    expect(slices.length).toBe(1);
    expect(slices[0].index).toBe(1);
    expect(slices[0].start).toBe(0);
    expect(slices[0].end).toBeCloseTo(2 * Math.PI);
  });

  it('returns nothing when there is nothing to show', () => {
    expect(donutSlices([])).toEqual([]);
    expect(donutSlices([0, 0])).toEqual([]);
  });
});

describe('colours', () => {
  it('mixes two colours and clamps the position', () => {
    expect(lerpColor('#000000', '#ffffff', 0)).toBe('rgb(0, 0, 0)');
    expect(lerpColor('#000000', '#ffffff', 1)).toBe('rgb(255, 255, 255)');
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
    expect(lerpColor('#000000', '#ffffff', 7)).toBe('rgb(255, 255, 255)');
    expect(lerpColor('#000000', '#ffffff', -1)).toBe('rgb(0, 0, 0)');
  });

  it('gives an empty cell a faint colour and a busy one the light cyan', () => {
    expect(heatColor(0, 10)).toContain('0.08');
    expect(heatColor(5, 0)).toContain('0.08');
    expect(heatColor(10, 10)).toBe('rgb(63, 210, 240)');
    expect(heatColor(5, 10)).not.toBe(heatColor(10, 10));
  });
});

describe('deviceLabel', () => {
  it('names the device class and adds a known browser', () => {
    expect(deviceLabel('DESKTOP_BROWSER', 'CHROME')).toBe('Navegador de escritorio · Chrome');
    expect(deviceLabel('MOBILE_BROWSER', 'SAFARI')).toBe('Navegador móvil · Safari');
    expect(deviceLabel('API_CLIENT', 'OTHER')).toBe('Cliente de API o BFF');
    expect(deviceLabel('UNKNOWN', 'OTHER')).toBe('Sin dato');
    expect(deviceLabel('OTHER', 'OTHER')).toBe('Otro');
    expect(deviceLabel('SOMETHING', 'FIREFOX')).toBe('SOMETHING · Firefox');
  });
});

describe('capacityOf', () => {
  it('works out averages, peaks and shares', () => {
    const capacity = capacityOf({
      summary: summary(),
      weekly: [
        { period: '2026-10-05', logins: 6, failures: 0, logouts: 0, activeUsers: 2 },
        { period: '2026-10-12', logins: 0, failures: 0, logouts: 0, activeUsers: 0 },
        { period: '2026-10-19', logins: 2, failures: 1, logouts: 0, activeUsers: 1 },
      ],
      hours: [
        { hour: 9, logins: 3 },
        { hour: 14, logins: 5 },
      ],
    });

    expect(capacity.averagePerActiveWeek).toBe(4);
    expect(capacity.peakWeek).toBe('2026-10-05');
    expect(capacity.peakWeekLogins).toBe(6);
    expect(capacity.peakHour).toBe('14:00');
    expect(capacity.peakHourLogins).toBe(5);
    expect(capacity.loginsPerUser).toBe(2);
    expect(capacity.activeWeeksShare).toBeCloseTo(2 / 3);
  });

  it('is all zeros when there is no data', () => {
    const capacity = capacityOf({ summary: summary({ activeUsers: 0, logins: 0 }), weekly: [], hours: [] });

    expect(capacity.averagePerActiveWeek).toBe(0);
    expect(capacity.peakWeek).toBeNull();
    expect(capacity.peakHour).toBe('00:00');
    expect(capacity.loginsPerUser).toBe(0);
    expect(capacity.activeWeeksShare).toBe(0);
  });
});
