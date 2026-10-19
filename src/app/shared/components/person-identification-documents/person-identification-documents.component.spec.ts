import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonIdentificationDocumentsComponent } from './person-identification-documents.component';
import { IdentificationDocumentService } from '@core/services/identification-document.service';
import { ToastService } from '@core/services/toast.service';
import {
  IDENTIFICATION_TYPE_IDENTIFICATION,
  IDENTIFICATION_TYPE_PASSPORT,
  IdentificationDocument,
} from '@shared/models/identification-document.model';

const doc: IdentificationDocument = {
  id: 'd1',
  number: 'V12345678',
  identificationType: IDENTIFICATION_TYPE_IDENTIFICATION,
  expirationDate: '2030-01-01',
  personId: 'p1',
};

describe('PersonIdentificationDocumentsComponent', () => {
  let fixture: ComponentFixture<PersonIdentificationDocumentsComponent>;
  let el: HTMLElement;
  let svc: jasmine.SpyObj<IdentificationDocumentService>;
  let toast: jasmine.SpyObj<ToastService>;

  const q = (sel: string) => el.querySelector(sel) as HTMLElement | null;
  const click = (sel: string) => {
    q(sel)!.click();
    fixture.detectChanges();
  };
  const type = (sel: string, value: string) => {
    const input = q(sel) as HTMLInputElement | HTMLSelectElement;
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  };
  const dialogButton = (label: string) =>
    Array.from(el.querySelectorAll('app-confirm-dialog button')).find((b) =>
      b.textContent?.includes(label),
    ) as HTMLElement;

  function create(list: IdentificationDocument[] = [doc]) {
    svc.getByPerson.and.returnValue(of(list));
    fixture = TestBed.createComponent(PersonIdentificationDocumentsComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => {
    svc = jasmine.createSpyObj('IdentificationDocumentService', [
      'getByPerson',
      'create',
      'update',
      'delete',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [PersonIdentificationDocumentsComponent],
      providers: [
        { provide: IdentificationDocumentService, useValue: svc },
        { provide: ToastService, useValue: toast },
      ],
    });
  });

  it('renders documents with type label and expiration', () => {
    create();
    expect(svc.getByPerson).toHaveBeenCalledWith('p1');
    expect(el.textContent).toContain('Cédula: V12345678');
    expect(el.textContent).toContain('vence 2030-01-01');
  });

  it('labels passports', () => {
    create([{ ...doc, identificationType: IDENTIFICATION_TYPE_PASSPORT, expirationDate: undefined }]);
    expect(el.textContent).toContain('Pasaporte: V12345678');
    expect(el.textContent).not.toContain('vence');
  });

  it('renders the empty state', () => {
    create([]);
    expect(el.textContent).toContain('no tiene documentos');
  });

  it('toasts on load error', () => {
    svc.getByPerson.and.returnValue(throwError(() => new Error('x')));
    fixture = TestBed.createComponent(PersonIdentificationDocumentsComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los documentos');
  });

  it('requires the document number', () => {
    create();
    click('button.border-blue-300');
    click('form button[type=submit]');
    expect(svc.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('El número es obligatorio');
  });

  it('rejects a malformed number', () => {
    create();
    click('button.border-blue-300');
    type('input[formControlName=number]', '12 34');
    click('form button[type=submit]');
    expect(svc.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Número de documento inválido');
  });

  it('creates a document', () => {
    create();
    svc.create.and.returnValue(of(doc));
    click('button.border-blue-300');
    type('input[formControlName=number]', ' P-998877 ');
    click('form button[type=submit]');
    expect(svc.create).toHaveBeenCalledWith({
      identificationDocument: {
        id: undefined,
        number: 'P-998877',
        expirationDate: undefined,
        identificationType: IDENTIFICATION_TYPE_IDENTIFICATION,
        personId: 'p1',
      },
    });
    expect(toast.success).toHaveBeenCalledWith('Documento agregado');
  });

  it('toasts on save error', () => {
    create();
    svc.create.and.returnValue(throwError(() => new Error('x')));
    click('button.border-blue-300');
    type('input[formControlName=number]', 'A1');
    click('form button[type=submit]');
    expect(toast.error).toHaveBeenCalledWith('Error al guardar el documento');
    expect(q('form')).not.toBeNull();
  });

  it('edits a document', () => {
    create();
    svc.update.and.returnValue(of(doc));
    click('button[title=Editar]');
    expect((q('input[formControlName=number]') as HTMLInputElement).value).toBe('V12345678');
    type('input[formControlName=number]', 'V87654321');
    click('form button[type=submit]');
    expect(svc.update).toHaveBeenCalledWith('d1', {
      identificationDocument: jasmine.objectContaining({ id: 'd1', number: 'V87654321' }),
    });
    expect(toast.success).toHaveBeenCalledWith('Documento actualizado');
  });

  it('cancels the form', () => {
    create();
    click('button.border-blue-300');
    const cancel = Array.from(el.querySelectorAll('form button')).find((b) =>
      b.textContent?.includes('Cancelar'),
    ) as HTMLElement;
    cancel.click();
    fixture.detectChanges();
    expect(q('form')).toBeNull();
  });

  it('does not delete when the confirmation is cancelled', () => {
    create();
    click('button[title=Eliminar]');
    dialogButton('Cancelar').click();
    fixture.detectChanges();
    expect(svc.delete).not.toHaveBeenCalled();
  });

  it('deletes after confirmation', () => {
    create();
    svc.delete.and.returnValue(of(doc));
    click('button[title=Eliminar]');
    dialogButton('Confirmar').click();
    expect(svc.delete).toHaveBeenCalledWith('d1');
    expect(toast.success).toHaveBeenCalledWith('Documento eliminado');
  });

  it('toasts on delete error', () => {
    create();
    svc.delete.and.returnValue(throwError(() => new Error('x')));
    click('button[title=Eliminar]');
    dialogButton('Confirmar').click();
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el documento');
  });
});
