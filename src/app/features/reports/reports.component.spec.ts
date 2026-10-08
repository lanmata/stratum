import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ReportService } from '@core/services/report.service';
import { ToastService } from '@core/services/toast.service';
import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let service: jasmine.SpyObj<ReportService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create(platform = 'browser') {
    service = jasmine.createSpyObj('ReportService', ['placeholders', 'generate']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    const fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  function choose(dom: Dom<ReportsComponent>, file: File | null) {
    const input = dom.q<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: file ? [file] : [], configurable: true });
    input.dispatchEvent(new Event('change'));
    dom.fixture.detectChanges();
  }

  function captureDownloads(): string[] {
    const names: string[] = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    return names;
  }

  const docx = () => new File(['d'], 'Informe mensual.docx');

  it('starts without actions until a template is chosen', () => {
    const dom = create();
    expect(dom.text).not.toContain('Generar documento');
    expect(dom.text).not.toContain('Detectar marcadores');
  });

  it('rejects templates that are not .docx', () => {
    const dom = create();
    choose(dom, new File(['x'], 'notes.txt'));
    expect(dom.text).toContain('debe ser un archivo .docx');
    expect(dom.text).not.toContain('Generar documento');
  });

  it('clears the template when the file dialog is cancelled', () => {
    const dom = create();
    choose(dom, docx());
    choose(dom, null);
    expect(dom.text).not.toContain('Generar documento');
  });

  it('proposes the file name as the template name and detects placeholders', async () => {
    const dom = create();
    service.placeholders.and.returnValue(of(['nombre', 'fecha']));
    choose(dom, docx());
    await dom.stable();
    expect(dom.q<HTMLInputElement>('#report-name')!.value).toBe('Informe mensual');
    dom.type('#report-description', 'Resumen');
    dom.clickByText('button', 'Detectar marcadores');
    expect(service.placeholders).toHaveBeenCalledWith(jasmine.any(File), { templateName: 'Informe mensual', description: 'Resumen' });
    expect(dom.qa('input[id^=ph-]').length).toBe(2);
  });

  it('sends null metadata when name and description are blank', async () => {
    const dom = create();
    service.placeholders.and.returnValue(of([]));
    choose(dom, docx());
    await dom.stable();
    dom.type('#report-name', '');
    dom.clickByText('button', 'Detectar marcadores');
    expect(service.placeholders.calls.mostRecent().args[1]).toEqual({ templateName: null, description: null });
    expect(dom.text).toContain('no contiene marcadores');
  });

  it('reports placeholder detection errors', () => {
    const dom = create();
    service.placeholders.and.returnValue(throwError(() => new Error('x')));
    choose(dom, docx());
    dom.clickByText('button', 'Detectar marcadores');
    expect(toast.error).toHaveBeenCalledWith('Error al analizar la plantilla');
    expect(dom.text).toContain('Detectar marcadores');
  });

  it('generates and downloads the document with the entered values', async () => {
    const dom = create();
    const names = captureDownloads();
    service.placeholders.and.returnValue(of(['nombre']));
    service.generate.and.returnValue(of(new Blob(['docx'])));
    choose(dom, docx());
    await dom.stable();
    dom.clickByText('button', 'Detectar marcadores');
    await dom.stable();
    dom.type('#ph-nombre', 'Ana');
    dom.clickByText('button', 'Generar documento');
    expect(service.generate).toHaveBeenCalledWith(jasmine.any(File), { nombre: 'Ana' });
    expect(names).toEqual(['Informe mensual.docx']);
    expect(toast.success).toHaveBeenCalledWith('Documento generado');
  });

  it('names the download "documento" when the template name is blank, and reports errors', async () => {
    const dom = create();
    const names = captureDownloads();
    service.generate.and.returnValue(of(new Blob(['docx'])));
    choose(dom, docx());
    await dom.stable();
    dom.type('#report-name', '');
    dom.clickByText('button', 'Generar documento');
    expect(names).toEqual(['documento.docx']);

    service.generate.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Generar documento');
    expect(toast.error).toHaveBeenCalledWith('Error al generar el documento');
  });

  it('does not generate on the server', () => {
    const dom = create('server');
    choose(dom, docx());
    dom.clickByText('button', 'Generar documento');
    expect(service.generate).not.toHaveBeenCalled();
  });
});
