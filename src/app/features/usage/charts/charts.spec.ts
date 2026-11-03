import { TestBed } from '@angular/core/testing';
import { Dom } from '@app/testing/dom';
import { HeatCell, HourBucket, UsagePoint } from '@shared/models/usage-report.model';
import { AreaChartComponent } from './area-chart.component';
import { BarListComponent } from './bar-list.component';
import { DonutChartComponent } from './donut-chart.component';
import { ColumnChartComponent } from './column-chart.component';
import { HeatmapComponent } from './heatmap.component';
import { HourColumnsComponent } from './hour-columns.component';

const point = (period: string, logins: number, failures = 0, users = 1): UsagePoint => ({
  period,
  logins,
  failures,
  logouts: 0,
  activeUsers: users,
});

function create<T>(component: new () => T, inputs: Record<string, unknown>): Dom<T> {
  const fixture = TestBed.createComponent(component);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return new Dom(fixture);
}

function pointer(dom: Dom<unknown>, selector: string, type: string, ratio: number): void {
  const target = dom.q(selector) as unknown as SVGElement;
  const rect = target.getBoundingClientRect();
  target.dispatchEvent(new PointerEvent(type, { clientX: rect.left + rect.width * ratio, bubbles: true }));
  dom.fixture.detectChanges();
}

describe('AreaChartComponent', () => {
  const weeks = [point('2026-09-28', 10, 0, 2), point('2026-10-05', 40, 3, 3), point('2026-10-12', 20, 0, 2), point('2026-11-02', 5, 1, 1)];

  it('draws the area, the line, the failure columns and one label per month', () => {
    const dom = create(AreaChartComponent, { points: weeks });

    expect(dom.q('svg')?.getAttribute('aria-label')).toContain('4 puntos');
    expect(dom.qa('path').length).toBe(2);
    expect(dom.qa('path')[1].getAttribute('d')).toMatch(/^M/);
    expect(dom.qa('rect').length).toBe(1 + 2); // hit area + two weeks with failures
    const labels = dom.qa('text').map((t) => t.textContent?.trim());
    expect(labels).toContain('sep');
    expect(labels).toContain('oct');
    expect(labels).toContain('nov');
    expect(labels).toContain('50');
  });

  it('anchors a month label at its end when it would be cut by the right edge', () => {
    const dom = create(AreaChartComponent, { points: weeks });
    const anchors = dom.qa('text').filter((t) => ['sep', 'oct', 'nov'].includes(t.textContent?.trim() ?? '')).map((t) => t.getAttribute('text-anchor'));

    expect(anchors).toEqual(['start', 'start', 'end']);
  });

  it('shows the bucket under the pointer and hides it on leave', () => {
    const dom = create(AreaChartComponent, { points: weeks });
    expect(dom.q('.usage-tooltip')).toBeNull();

    pointer(dom, '.usage-area-hit', 'pointermove', 0.34);
    const tooltip = dom.q('.usage-tooltip');
    expect(tooltip?.textContent).toContain('Semana del 5 oct 2026');
    expect(tooltip?.textContent).toContain('40');
    expect(tooltip?.textContent).toContain('3');

    pointer(dom, '.usage-area-hit', 'pointerleave', 0.5);
    expect(dom.q('.usage-tooltip')).toBeNull();
  });

  it('puts the tooltip on the left of the pointer in the right half of the chart', () => {
    const dom = create(AreaChartComponent, { points: weeks });

    pointer(dom, '.usage-area-hit', 'pointermove', 1);

    expect(dom.q<HTMLElement>('.usage-tooltip')?.style.transform).toContain('-105%');
    expect(dom.q('.usage-tooltip')?.textContent).toContain('2 nov 2026');
  });

  it('copes with a single point and with no points', () => {
    const one = create(AreaChartComponent, { points: [point('2026-10-05', 3)] });
    pointer(one, '.usage-area-hit', 'pointermove', 0.9);
    expect(one.q('.usage-tooltip')?.textContent).toContain('5 oct 2026');

    const none = create(AreaChartComponent, { points: [] });
    expect(none.q('svg')).not.toBeNull();
    pointer(none, '.usage-area-hit', 'pointermove', 0.5);
    expect(none.q('.usage-tooltip')).toBeNull();
  });
});

describe('DonutChartComponent', () => {
  const data = [
    { label: 'Navegador de escritorio · Chrome', value: 60 },
    { label: 'Cliente de API o BFF', value: 30 },
    { label: 'Sin dato', value: 10 },
  ];

  it('draws one slice per value, a legend with shares, and the total in the centre', () => {
    const dom = create(DonutChartComponent, { data });

    expect(dom.qa('path').length).toBe(3);
    expect(dom.qa('li').length).toBe(3);
    expect(dom.q('li')?.textContent).toContain('60 · 60 %');
    expect(dom.qa('text')[0].textContent).toBe('100');
    expect(dom.qa('text')[1].textContent).toBe('eventos');
  });

  it('shows the slice under the pointer in the centre and fades the others', () => {
    const dom = create(DonutChartComponent, { data });
    const second = dom.qa('path')[1];

    second.dispatchEvent(new PointerEvent('pointerenter'));
    dom.fixture.detectChanges();
    expect(dom.qa('text')[0].textContent).toBe('30');
    expect(dom.qa('text')[1].textContent).toBe('Cliente de API o BFF');
    expect(dom.qa('path')[0].getAttribute('opacity')).toBe('0.35');
    expect(second.getAttribute('opacity')).toBe('1');

    second.dispatchEvent(new PointerEvent('pointerleave'));
    dom.fixture.detectChanges();
    expect(dom.qa('text')[0].textContent).toBe('100');
  });

  it('cuts a long label in the centre and handles an empty list', () => {
    const dom = create(DonutChartComponent, { data: [{ label: 'Navegador de escritorio · Chrome', value: 5 }] });
    dom.qa('path')[0].dispatchEvent(new PointerEvent('pointerenter'));
    dom.fixture.detectChanges();
    expect(dom.qa('text')[1].textContent).toBe('Navegador de escritor…');

    const empty = create(DonutChartComponent, { data: [] });
    expect(empty.qa('path').length).toBe(0);
    expect(empty.qa('text')[0].textContent).toBe('0');
  });
});

describe('BarListComponent', () => {
  it('draws one row per application with the failed part at the end', () => {
    const dom = create(BarListComponent, {
      data: [
        { label: 'Backbone', value: 100, alert: 10, detail: '2 con accesos' },
        { label: 'Iris', value: 50, alert: 0, detail: '1 con accesos' },
      ],
    });

    expect(dom.qa('li').length).toBe(2);
    const first = dom.qa('li')[0];
    expect(first.textContent).toContain('Backbone');
    expect(first.textContent).toContain('2 con accesos');
    expect(first.querySelectorAll('div.rounded-md').length).toBe(2);
    expect(dom.qa('li')[1].querySelectorAll('div.rounded-md').length).toBe(1);
    expect(first.getAttribute('title')).toContain('10 fallidos');
    expect(dom.qa<HTMLElement>('li div.rounded-md')[0].style.width).toBe('90%');
  });

  it('does not divide by zero when every row is empty', () => {
    const dom = create(BarListComponent, { data: [{ label: 'Empty', value: 0, alert: 0, detail: '' }] });

    expect(dom.qa<HTMLElement>('li div.rounded-md')[0].style.width).toBe('0%');
  });
});

describe('HourColumnsComponent', () => {
  const hours: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, logins: hour === 14 ? 17 : hour === 2 ? 5 : 0 }));

  it('draws 24 columns, marks the peak hour and labels every third hour', () => {
    const dom = create(HourColumnsComponent, { data: hours });

    expect(dom.qa('rect').length).toBe(24);
    expect(dom.qa('rect').filter((r) => r.getAttribute('fill')?.includes('amber')).length).toBe(1);
    expect(dom.qa('rect')[14].getAttribute('fill')).toBe('url(#usage-hour-amber)');
    expect(dom.q('rect:nth-of-type(15) title')?.textContent).toContain('14:00 a 14:59: 17 accesos');
    const texts = dom.qa('text').map((t) => t.textContent?.trim());
    expect(texts).toContain('00');
    expect(texts).toContain('21');
    expect(texts).not.toContain('01');
    expect(texts).toContain('17');
  });

  it('uses round axis ticks', () => {
    const dom = create(HourColumnsComponent, { data: hours.map((h) => ({ ...h, logins: h.hour === 14 ? 20 : 0 })) });
    const labels = dom.qa('text').map((t) => t.textContent?.trim());

    expect(labels).toEqual(jasmine.arrayContaining(['0', '5', '10', '15', '20']));
  });

  it('marks no peak when nothing happened', () => {
    const dom = create(HourColumnsComponent, { data: hours.map((h) => ({ ...h, logins: 0 })) });

    expect(dom.qa('rect').filter((r) => r.getAttribute('fill')?.includes('amber')).length).toBe(0);
  });

  it('handles an empty list', () => {
    expect(create(HourColumnsComponent, { data: [] }).qa('rect').length).toBe(0);
  });
});

describe('HeatmapComponent', () => {
  const cells: HeatCell[] = [];
  for (let day = 1; day <= 7; day++) for (let slot = 0; slot < 6; slot++) cells.push({ dayOfWeek: day, slot, logins: day === 1 && slot === 2 ? 20 : day === 3 && slot === 0 ? 4 : 0 });

  it('draws 42 cells with headers, and numbers only on cells with logins', () => {
    const dom = create(HeatmapComponent, { data: cells });

    expect(dom.qa('rect').length).toBe(42);
    const texts = dom.qa('text').map((t) => t.textContent?.trim());
    expect(texts).toContain('Lun');
    expect(texts).toContain('Dom');
    expect(texts).toContain('8–11');
    expect(texts).toContain('20');
    expect(texts).toContain('4');
    expect(dom.q('rect title')?.textContent).toContain('Lun, 0–3 h: 0 accesos');
    expect(dom.qa('rect')[2].querySelector('title')?.textContent).toContain('Lun, 8–11 h: 20 accesos');
  });

  it('uses dark numbers on the lightest cells and light numbers on the rest', () => {
    const dom = create(HeatmapComponent, { data: cells });
    const fills = dom.qa('text').filter((t) => ['20', '4'].includes(t.textContent?.trim() ?? '')).map((t) => t.getAttribute('fill'));

    expect(fills).toEqual(['#06202C', '#E6EDF7']);
  });

  it('draws a faint grid when nothing happened', () => {
    const dom = create(HeatmapComponent, { data: cells.map((c) => ({ ...c, logins: 0 })) });

    expect(dom.qa('rect')[0].getAttribute('fill')).toContain('0.08');
    expect(dom.qa('text').some((t) => t.textContent?.trim() === '0')).toBeFalse();
  });
});

describe('ColumnChartComponent', () => {
  it('draws a column per month with failures stacked on top', () => {
    const dom = create(ColumnChartComponent, {
      points: [point('2026-09-01', 12, 9), point('2026-10-01', 121, 6), point('2026-11-01', 15, 0)],
    });

    expect(dom.qa('rect').length).toBe(3 + 2);
    const texts = dom.qa('text').map((t) => t.textContent?.trim());
    expect(texts).toEqual(jasmine.arrayContaining(['sep', 'oct', 'nov', '12', '121', '15']));
    expect(dom.q('rect title')?.textContent).toContain('sep 2026: 12 accesos, 9 fallidos');
  });

  it('handles an empty series', () => {
    expect(create(ColumnChartComponent, { points: [] }).qa('rect').length).toBe(0);
  });
});
