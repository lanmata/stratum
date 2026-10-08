import { Component, signal } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { Dom } from '@app/testing/dom';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { IconComponent } from './icon/icon.component';
import { ToastComponent } from './toast/toast.component';
import { PLATFORM_ID } from '@angular/core';

@Component({
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `<app-confirm-dialog
    message="¿Seguro?"
    [title]="title"
    confirmLabel="Sí"
    cancelLabel="No"
    [confirmStyle]="style()"
    (confirmed)="confirmed = confirmed + 1"
    (cancelled)="cancelled = cancelled + 1"
  />`,
})
class HostComponent {
  title = 'Borrar';
  style = signal<'danger' | 'primary'>('danger');
  confirmed = 0;
  cancelled = 0;
}

describe('ConfirmDialogComponent', () => {
  function create() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, dom: new Dom(fixture) };
  }

  it('renders title, message and labels', () => {
    const { dom } = create();
    expect(dom.text).toContain('Borrar');
    expect(dom.text).toContain('¿Seguro?');
    expect(dom.text).toContain('Sí');
    expect(dom.text).toContain('No');
  });

  it('emits confirmed and cancelled', () => {
    const { dom, host } = create();
    dom.clickByText('button', 'Sí');
    dom.clickByText('button', 'No');
    expect(host.confirmed).toBe(1);
    expect(host.cancelled).toBe(1);
  });

  it('cancels on Escape', () => {
    const { host } = create();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.cancelled).toBe(1);
  });

  it('styles the confirm button by variant', () => {
    const { fixture, dom, host } = create();
    expect(dom.qa('button')[1].className).toContain('bg-red-600');
    host.style.set('primary');
    fixture.detectChanges();
    expect(dom.qa('button')[1].className).toContain('bg-blue-600');
  });

  it('uses default title and labels', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('message', 'm');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirmar acción');
    expect(fixture.nativeElement.textContent).toContain('Cancelar');
  });
});

describe('IconComponent', () => {
  it('renders the path of the requested icon with the default and custom size', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'home');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('class')).toBe('h-5 w-5');
    expect(fixture.nativeElement.querySelector('path').getAttribute('d')).toContain('M2.25 12');

    fixture.componentRef.setInput('size', 'h-8 w-8');
    fixture.componentRef.setInput('name', 'shield');
    fixture.detectChanges();
    expect(svg.getAttribute('class')).toBe('h-8 w-8');
    expect(fixture.nativeElement.querySelector('path').getAttribute('d')).toContain('M9 12.75');
  });
});

describe('ToastComponent', () => {
  function create(platform = 'browser') {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    return { fixture, dom: new Dom(fixture), toast: TestBed.inject(ToastService) };
  }

  it('renders toasts with a colour per type and dismisses them', () => {
    const { fixture, dom, toast } = create();
    toast.success('a', 0);
    toast.error('b', 0);
    toast.warning('c', 0);
    toast.info('d', 0);
    fixture.detectChanges();
    const classes = dom.qa('.animate-toast-in').map((e) => e.className);
    expect(classes[0]).toContain('bg-green-500');
    expect(classes[1]).toContain('bg-red-500');
    expect(classes[2]).toContain('bg-amber-500');
    expect(classes[3]).toContain('bg-blue-500');

    dom.click('button[aria-label=Cerrar]');
    expect(dom.qa('.animate-toast-in').length).toBe(3);
  });

  it('copies the toast value to the clipboard and shows a confirmation for two seconds', fakeAsync(() => {
    const { fixture, dom, toast } = create();
    const writeText = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    toast.info('id', 0, 'abc');
    fixture.detectChanges();
    dom.clickByText('button', 'Copiar');
    flushMicrotasks();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('abc');
    expect(dom.text).toContain('Copiado');
    tick(2000);
    fixture.detectChanges();
    expect(dom.text).not.toContain('Copiado');
  }));

  it('does not offer copy for toasts without a value, nor copy on the server', () => {
    const { fixture, dom, toast } = create('server');
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    toast.info('x', 0, 'abc');
    toast.info('y', 0);
    fixture.detectChanges();
    expect(dom.qa('button').filter((b) => b.textContent?.includes('Copiar')).length).toBe(1);
    dom.clickByText('button', 'Copiar');
    expect(writeText).not.toHaveBeenCalled();
  });
});
