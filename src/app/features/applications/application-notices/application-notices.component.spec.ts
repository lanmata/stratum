import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { NoticeService } from '@core/services/notice.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import { ApplicationNoticesComponent } from './application-notices.component';

describe('ApplicationNoticesComponent', () => {
  let notices: jasmine.SpyObj<NoticeService>;
  let types: jasmine.SpyObj<NoticeTypeService>;
  let users: jasmine.SpyObj<UserService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create() {
    notices = jasmine.createSpyObj('NoticeService', ['getByApplication', 'create', 'delete']);
    types = jasmine.createSpyObj('NoticeTypeService', ['getAll']);
    users = jasmine.createSpyObj('UserService', ['getByApplication']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    notices.getByApplication.and.returnValue(
      of([
        { userId: 'u1', applicationId: 'a1', noticeTypeId: 'n1' },
        { userId: 'ghost', applicationId: 'a1', noticeTypeId: 'unknown' },
      ]),
    );
    notices.create.and.returnValue(of({ userId: 'u1', applicationId: 'a1', noticeTypeId: 'n1' }));
    notices.delete.and.returnValue(of(undefined));
    types.getAll.and.returnValue(of([{ id: 'n1', name: 'Bienvenida', active: true }]));
    users.getByApplication.and.returnValue(
      of([{ id: 'u1', alias: 'ana', displayName: 'Ana Pérez' }, { id: 'u2', alias: 'solo-alias', displayName: '' }] as never[]),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: NoticeService, useValue: notices },
        { provide: NoticeTypeService, useValue: types },
        { provide: UserService, useValue: users },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationNoticesComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('lists notices resolving user and notice type labels, falling back to ids', () => {
    const dom = create();
    expect(notices.getByApplication).toHaveBeenCalledWith('a1');
    expect(dom.text).toContain('Ana Pérez');
    expect(dom.text).toContain('Bienvenida');
    expect(dom.text).toContain('ghost');
    expect(dom.text).toContain('unknown');
  });

  it('shows an empty state', () => {
    TestBed.resetTestingModule();
    notices = jasmine.createSpyObj('NoticeService', ['getByApplication']);
    notices.getByApplication.and.returnValue(of([]));
    types = jasmine.createSpyObj('NoticeTypeService', ['getAll']);
    types.getAll.and.returnValue(of([]));
    users = jasmine.createSpyObj('UserService', ['getByApplication']);
    users.getByApplication.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        { provide: NoticeService, useValue: notices },
        { provide: NoticeTypeService, useValue: types },
        { provide: UserService, useValue: users },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationNoticesComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr td[colspan]').length).toBe(1);
  });

  it('reports load errors', () => {
    TestBed.resetTestingModule();
    notices = jasmine.createSpyObj('NoticeService', ['getByApplication']);
    notices.getByApplication.and.returnValue(throwError(() => new Error('x')));
    types = jasmine.createSpyObj('NoticeTypeService', ['getAll']);
    types.getAll.and.returnValue(of([]));
    users = jasmine.createSpyObj('UserService', ['getByApplication']);
    users.getByApplication.and.returnValue(of([]));
    toast = jasmine.createSpyObj('ToastService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: NoticeService, useValue: notices },
        { provide: NoticeTypeService, useValue: types },
        { provide: UserService, useValue: users },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } } },
      ],
    });
    TestBed.createComponent(ApplicationNoticesComponent).detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los avisos');
  });

  it('registers a notice for a user and reloads', () => {
    const dom = create();
    dom.clickByText('button', 'Registrar Aviso');
    expect(dom.q('form')).not.toBeNull();
    expect(dom.q<HTMLButtonElement>('form button[type=submit]')!.disabled).toBeTrue();
    dom.submit();
    expect(notices.create).not.toHaveBeenCalled();

    dom.type('select[formControlName=userId]', 'u1');
    dom.type('select[formControlName=noticeTypeId]', 'n1');
    dom.submit();
    expect(notices.create).toHaveBeenCalledWith({ notice: { userId: 'u1', applicationId: 'a1', noticeTypeId: 'n1' } });
    expect(toast.success).toHaveBeenCalledWith('Aviso registrado');
    expect(dom.q('form')).toBeNull();
    expect(notices.getByApplication).toHaveBeenCalledTimes(2);
  });

  it('cancels the form and reports create errors', () => {
    const dom = create();
    dom.clickByText('button', 'Registrar Aviso');
    dom.clickByText('button', 'Cancelar');
    expect(dom.q('form')).toBeNull();

    dom.clickByText('button', 'Registrar Aviso');
    notices.create.and.returnValue(throwError(() => new Error('x')));
    dom.type('select[formControlName=userId]', 'u1');
    dom.type('select[formControlName=noticeTypeId]', 'n1');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al registrar el aviso');
    expect(dom.q('form')).not.toBeNull();
  });

  it('revokes a notice after confirmation', () => {
    const dom = create();
    dom.click('button[title=Revocar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(notices.delete).toHaveBeenCalledWith('u1', 'a1', 'n1');
    expect(toast.success).toHaveBeenCalledWith('Aviso revocado');
  });

  it('keeps the notice when the revocation is cancelled and reports errors', () => {
    const dom = create();
    dom.click('button[title=Revocar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(notices.delete).not.toHaveBeenCalled();

    notices.delete.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Revocar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al revocar el aviso');
  });
});
