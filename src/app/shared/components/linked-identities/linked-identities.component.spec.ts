import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { FederationService } from '@core/services/federation.service';
import { ToastService } from '@core/services/toast.service';
import { LinkedIdentity } from '@shared/models/federation.model';
import { LinkedIdentitiesComponent } from './linked-identities.component';

const GOOGLE: LinkedIdentity = { id: 'i1', provider: 'google', email: 'ana@corp.com' };

describe('LinkedIdentitiesComponent', () => {
  let federation: jasmine.SpyObj<FederationService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create(identities: LinkedIdentity[] | 'error' = [GOOGLE]) {
    federation = jasmine.createSpyObj('FederationService', ['identities', 'unlink']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    federation.identities.and.returnValue(identities === 'error' ? throwError(() => new Error('x')) : of(identities));
    federation.unlink.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: FederationService, useValue: federation },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(LinkedIdentitiesComponent);
    fixture.componentRef.setInput('userId', 'u1');
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('carga y lista las cuentas del usuario', () => {
    const dom = create();
    expect(federation.identities).toHaveBeenCalledOnceWith('u1');
    expect(dom.text).toContain('ana@corp.com');
    expect(dom.q('[data-testid=empty]')).toBeNull();
  });

  it('sin cuentas lo dice', () => {
    expect(create([]).q('[data-testid=empty]')).not.toBeNull();
  });

  it('un fallo al cargar avisa y deja la lista vacía', () => {
    const dom = create('error');
    expect(dom.q('[data-testid=problem]')).not.toBeNull();
    expect(dom.q('[data-testid=empty]')).not.toBeNull();
  });

  it('desenlazar pide confirmación; cancelar no hace nada y confirmar desenlaza y recarga', () => {
    const dom = create();
    dom.click('[data-action=unlink]');
    expect(dom.text).toContain('Confirmar');
    dom.click('[data-action=cancel]');
    expect(federation.unlink).not.toHaveBeenCalled();

    dom.click('[data-action=unlink]');
    dom.click('[data-action=confirm]');
    expect(federation.unlink).toHaveBeenCalledOnceWith('u1', 'i1');
    expect(toast.success).toHaveBeenCalled();
    expect(federation.identities).toHaveBeenCalledTimes(2);
  });

  it('si desenlazar falla, avisa', () => {
    const dom = create();
    federation.unlink.and.returnValue(throwError(() => new Error('x')));
    dom.click('[data-action=unlink]');
    dom.click('[data-action=confirm]');
    expect(dom.q('[data-testid=problem]')).not.toBeNull();
  });

  it('una cuenta sin correo ni nombre muestra un texto neutro', () => {
    expect(create([{ id: 'i2', provider: 'github' }]).text).toContain('Sin datos del proveedor');
  });
});
