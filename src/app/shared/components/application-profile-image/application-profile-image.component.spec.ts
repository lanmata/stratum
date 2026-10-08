import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ProfileImageService } from '@core/services/profile-image.service';
import { ToastService } from '@core/services/toast.service';
import { ApplicationProfileImageComponent, MAX_IMAGE_BYTES } from './application-profile-image.component';

describe('ApplicationProfileImageComponent', () => {
  let service: jasmine.SpyObj<ProfileImageService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create(ref: unknown = of({ ref: 'img-1' })) {
    service = jasmine.createSpyObj('ProfileImageService', ['getReference', 'upload']);
    service.getReference.and.returnValue(ref as never);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileImageService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationProfileImageComponent);
    fixture.componentRef.setInput('applicationId', 'a1');
    fixture.detectChanges();
    return new Dom(fixture);
  }

  function choose(dom: Dom<ApplicationProfileImageComponent>, file: File | null) {
    const input = dom.q<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: file ? [file] : [], configurable: true });
    input.dispatchEvent(new Event('change'));
    dom.fixture.detectChanges();
  }

  const png = () => new File(['x'], 'logo.png', { type: 'image/png' });

  it('shows the current reference', () => {
    const dom = create();
    expect(service.getReference).toHaveBeenCalledWith('a1');
    expect(dom.text).toContain('img-1');
  });

  it('shows that the application has no image yet', () => {
    expect(create(throwError(() => ({ status: 404 }))).text).toContain('todavía no tiene imagen');
    TestBed.resetTestingModule();
    expect(create(of({})).text).toContain('todavía no tiene imagen');
  });

  it('uploads a selected image and shows the new reference', () => {
    const dom = create(throwError(() => ({ status: 404 })));
    service.upload.and.returnValue(of({ ref: 'new-ref' }));
    const upload = dom.q<HTMLButtonElement>('button')!;
    expect(upload.disabled).toBeTrue();
    choose(dom, png());
    expect(upload.disabled).toBeFalse();
    dom.click('button');
    expect(service.upload).toHaveBeenCalledWith('a1', jasmine.any(File));
    expect(dom.text).toContain('new-ref');
    expect(toast.success).toHaveBeenCalledWith('Imagen subida correctamente');
    expect(dom.q<HTMLButtonElement>('button')!.disabled).toBeTrue();
  });

  it('rejects files that are not images', () => {
    const dom = create();
    choose(dom, new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    expect(dom.text).toContain('debe ser una imagen');
    expect(dom.q<HTMLButtonElement>('button')!.disabled).toBeTrue();
  });

  it('rejects images over 5 MB', () => {
    const dom = create();
    const big = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: MAX_IMAGE_BYTES + 1 });
    choose(dom, big);
    expect(dom.text).toContain('no puede superar 5 MB');
  });

  it('clears the selection when the file dialog is cancelled', () => {
    const dom = create();
    choose(dom, png());
    choose(dom, null);
    expect(dom.q<HTMLButtonElement>('button')!.disabled).toBeTrue();
  });

  it('reports upload errors and ignores upload without a file', () => {
    const dom = create();
    service.upload.and.returnValue(throwError(() => new Error('x')));
    dom.q<HTMLButtonElement>('button')!.click();
    expect(service.upload).not.toHaveBeenCalled();
    choose(dom, png());
    dom.click('button');
    expect(toast.error).toHaveBeenCalledWith('Error al subir la imagen');
    expect(dom.q<HTMLButtonElement>('button')!.disabled).toBeFalse();
  });
});
