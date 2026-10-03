import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonAddressesComponent } from './person-addresses.component';
import { AddressService } from '@core/services/address.service';
import { ToastService } from '@core/services/toast.service';
import { Address } from '@shared/models/address.model';

const address: Address = { id: 'a1', personId: 'p1', content: 'Av. Principal 123', zipcode: '1010' };

describe('PersonAddressesComponent', () => {
  let fixture: ComponentFixture<PersonAddressesComponent>;
  let el: HTMLElement;
  let svc: jasmine.SpyObj<AddressService>;
  let toast: jasmine.SpyObj<ToastService>;

  const q = (sel: string) => el.querySelector(sel) as HTMLElement | null;
  const click = (sel: string) => {
    q(sel)!.click();
    fixture.detectChanges();
  };
  const type = (sel: string, value: string) => {
    const input = q(sel) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const dialogButton = (label: string) =>
    Array.from(el.querySelectorAll('app-confirm-dialog button')).find((b) =>
      b.textContent?.includes(label),
    ) as HTMLElement;

  function create(list: Address[] = [address]) {
    svc.getByPerson.and.returnValue(of(list));
    fixture = TestBed.createComponent(PersonAddressesComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => {
    svc = jasmine.createSpyObj('AddressService', ['getByPerson', 'create', 'update', 'delete']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      imports: [PersonAddressesComponent],
      providers: [
        { provide: AddressService, useValue: svc },
        { provide: ToastService, useValue: toast },
      ],
    });
  });

  it('renders addresses', () => {
    create();
    expect(svc.getByPerson).toHaveBeenCalledWith('p1');
    expect(el.textContent).toContain('Av. Principal 123');
  });

  it('renders the empty state', () => {
    create([]);
    expect(el.textContent).toContain('no tiene direcciones');
  });

  it('toasts on load error', () => {
    svc.getByPerson.and.returnValue(throwError(() => new Error('x')));
    fixture = TestBed.createComponent(PersonAddressesComponent);
    fixture.componentRef.setInput('personId', 'p1');
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar las direcciones');
  });

  it('requires the address content', () => {
    create();
    click('button.border-blue-300');
    click('form button[type=submit]');
    expect(svc.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('La dirección es obligatoria');
  });

  it('rejects whitespace-only content', () => {
    create();
    click('button.border-blue-300');
    type('input[formControlName=content]', '   ');
    click('form button[type=submit]');
    expect(svc.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid zip code', () => {
    create();
    click('button.border-blue-300');
    type('input[formControlName=content]', 'Calle 1');
    type('input[formControlName=zipcode]', '#!');
    click('form button[type=submit]');
    expect(svc.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Código postal inválido');
  });

  it('creates an address with trimmed values', () => {
    create();
    svc.create.and.returnValue(of(address));
    click('button.border-blue-300');
    type('input[formControlName=content]', ' Calle 1 ');
    click('form button[type=submit]');
    expect(svc.create).toHaveBeenCalledWith({
      address: { id: undefined, personId: 'p1', content: 'Calle 1', zipcode: undefined },
    });
    expect(toast.success).toHaveBeenCalledWith('Dirección agregada');
    expect(svc.getByPerson).toHaveBeenCalledTimes(2);
  });

  it('toasts on save error', () => {
    create();
    svc.create.and.returnValue(throwError(() => new Error('x')));
    click('button.border-blue-300');
    type('input[formControlName=content]', 'Calle 1');
    click('form button[type=submit]');
    expect(toast.error).toHaveBeenCalledWith('Error al guardar la dirección');
    expect(q('form')).not.toBeNull();
  });

  it('edits an address', () => {
    create();
    svc.update.and.returnValue(of(address));
    click('button[title=Editar]');
    expect((q('input[formControlName=zipcode]') as HTMLInputElement).value).toBe('1010');
    type('input[formControlName=content]', 'Nueva calle');
    click('form button[type=submit]');
    expect(svc.update).toHaveBeenCalledWith('a1', {
      address: { id: 'a1', personId: 'p1', content: 'Nueva calle', zipcode: '1010' },
    });
    expect(toast.success).toHaveBeenCalledWith('Dirección actualizada');
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
    expect(q('app-confirm-dialog')).toBeNull();
  });

  it('deletes after confirmation', () => {
    create();
    svc.delete.and.returnValue(of(address));
    click('button[title=Eliminar]');
    dialogButton('Confirmar').click();
    expect(svc.delete).toHaveBeenCalledWith('a1');
    expect(toast.success).toHaveBeenCalledWith('Dirección eliminada');
  });

  it('toasts on delete error', () => {
    create();
    svc.delete.and.returnValue(throwError(() => new Error('x')));
    click('button[title=Eliminar]');
    dialogButton('Confirmar').click();
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar la dirección');
  });
});
