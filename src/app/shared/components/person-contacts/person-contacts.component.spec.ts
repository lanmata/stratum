import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonContactsComponent } from './person-contacts.component';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Contact, ContactType } from '@shared/models/contact.model';

const emailType: ContactType = { id: 't1', name: 'Email', active: true };
const phoneType: ContactType = { id: 't2', name: 'Teléfono', active: true };
const contact: Contact = {
  id: 'c1',
  content: 'a@b.com',
  contactType: emailType,
  personId: 'p1',
  active: true,
};

describe('PersonContactsComponent', () => {
  let fixture: ComponentFixture<PersonContactsComponent>;
  let el: HTMLElement;
  let contacts: jasmine.SpyObj<ContactService>;
  let types: jasmine.SpyObj<ContactTypeService>;
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

  function create(list: Contact[] = [contact]) {
    contacts.getByPerson.and.returnValue(of(list));
    fixture = TestBed.createComponent(PersonContactsComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => {
    contacts = jasmine.createSpyObj('ContactService', ['getByPerson', 'create', 'update', 'delete']);
    types = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    types.getAll.and.returnValue(of([emailType, phoneType]));
    TestBed.configureTestingModule({
      imports: [PersonContactsComponent],
      providers: [
        { provide: ContactService, useValue: contacts },
        { provide: ContactTypeService, useValue: types },
        { provide: ToastService, useValue: toast },
      ],
    });
  });

  it('renders the contacts for the person', () => {
    create();
    expect(contacts.getByPerson).toHaveBeenCalledWith('p1');
    expect(el.textContent).toContain('a@b.com');
    expect(el.textContent).toContain('Email');
  });

  it('renders the empty state', () => {
    create([]);
    expect(el.textContent).toContain('no tiene contactos');
  });

  it('shows inactive marker', () => {
    create([{ ...contact, active: false }]);
    expect(el.textContent).toContain('Inactivo');
  });

  it('toasts on load error', () => {
    contacts.getByPerson.and.returnValue(throwError(() => new Error('x')));
    fixture = TestBed.createComponent(PersonContactsComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los contactos');
  });

  it('blocks submit and shows errors when the form is empty', () => {
    create();
    click('button.border-blue-300');
    click('form button[type=submit]');
    expect(contacts.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('El contacto es obligatorio');
    expect(el.textContent).toContain('Selecciona un tipo de contacto');
  });

  it('rejects an invalid email for an email type', () => {
    create();
    click('button.border-blue-300');
    type('select', 't1');
    type('input[formControlName=content]', 'not-an-email');
    click('form button[type=submit]');
    expect(contacts.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Correo electrónico inválido');
  });

  it('rejects an invalid phone for a phone type', () => {
    create();
    click('button.border-blue-300');
    type('select', 't2');
    type('input[formControlName=content]', 'abc');
    click('form button[type=submit]');
    expect(contacts.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Número de teléfono inválido');
  });

  it('creates a contact, toasts and reloads', () => {
    create();
    contacts.create.and.returnValue(of(contact));
    click('button.border-blue-300');
    type('select', 't1');
    type('input[formControlName=content]', '  new@mail.com ');
    click('form button[type=submit]');
    expect(contacts.create).toHaveBeenCalledWith({
      id: undefined,
      content: 'new@mail.com',
      contactType: emailType,
      personId: 'p1',
      active: true,
    });
    expect(toast.success).toHaveBeenCalledWith('Contacto agregado');
    expect(contacts.getByPerson).toHaveBeenCalledTimes(2);
    expect(q('form')).toBeNull();
  });

  it('toasts on create error and keeps the form open', () => {
    create();
    contacts.create.and.returnValue(throwError(() => new Error('x')));
    click('button.border-blue-300');
    type('select', 't1');
    type('input[formControlName=content]', 'a@b.com');
    click('form button[type=submit]');
    expect(toast.error).toHaveBeenCalledWith('Error al guardar el contacto');
    expect(q('form')).not.toBeNull();
  });

  it('edits an existing contact', () => {
    create();
    contacts.update.and.returnValue(of(contact));
    click('button[title=Editar]');
    expect((q('input[formControlName=content]') as HTMLInputElement).value).toBe('a@b.com');
    type('input[formControlName=content]', 'changed@b.com');
    click('form button[type=submit]');
    expect(contacts.update).toHaveBeenCalledWith(
      'c1',
      jasmine.objectContaining({ id: 'c1', content: 'changed@b.com' }),
    );
    expect(toast.success).toHaveBeenCalledWith('Contacto actualizado');
  });

  it('cancels the form', () => {
    create();
    click('button.border-blue-300');
    expect(q('form')).not.toBeNull();
    const cancel = Array.from(el.querySelectorAll('form button')).find((b) =>
      b.textContent?.includes('Cancelar'),
    ) as HTMLElement;
    cancel.click();
    fixture.detectChanges();
    expect(q('form')).toBeNull();
  });

  it('asks for confirmation before deleting, and does not delete when cancelled', () => {
    create();
    click('button[title=Eliminar]');
    expect(q('app-confirm-dialog')).not.toBeNull();
    const cancel = Array.from(el.querySelectorAll('app-confirm-dialog button')).find((b) =>
      b.textContent?.includes('Cancelar'),
    ) as HTMLElement;
    cancel.click();
    fixture.detectChanges();
    expect(contacts.delete).not.toHaveBeenCalled();
    expect(q('app-confirm-dialog')).toBeNull();
  });

  it('deletes after confirmation and reloads', () => {
    create();
    contacts.delete.and.returnValue(of('ok'));
    click('button[title=Eliminar]');
    const confirm = Array.from(el.querySelectorAll('app-confirm-dialog button')).find((b) =>
      b.textContent?.includes('Confirmar'),
    ) as HTMLElement;
    confirm.click();
    fixture.detectChanges();
    expect(contacts.delete).toHaveBeenCalledWith('c1');
    expect(toast.success).toHaveBeenCalledWith('Contacto eliminado');
    expect(contacts.getByPerson).toHaveBeenCalledTimes(2);
  });

  it('toasts on delete error', () => {
    create();
    contacts.delete.and.returnValue(throwError(() => new Error('x')));
    click('button[title=Eliminar]');
    const confirm = Array.from(el.querySelectorAll('app-confirm-dialog button')).find((b) =>
      b.textContent?.includes('Confirmar'),
    ) as HTMLElement;
    confirm.click();
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el contacto');
  });
});
