import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ProfileImageService } from '@core/services/profile-image.service';
import { ToastService } from '@core/services/toast.service';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-application-profile-image',
  standalone: true,
  template: `
    <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Imagen de perfil
      </h2>

      <p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
        @if (loadingRef()) {
          Cargando referencia…
        } @else if (reference(); as ref) {
          Referencia actual: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">{{ ref }}</code>
        } @else {
          Esta aplicación todavía no tiene imagen.
        }
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <input
          #fileInput
          type="file"
          accept="image/*"
          aria-label="Seleccionar imagen"
          (change)="onFileChange($event)"
          class="block text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
        />
        <button
          type="button"
          (click)="upload(); fileInput.value = ''"
          [disabled]="!file() || uploading()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ uploading() ? 'Subiendo…' : 'Subir imagen' }}
        </button>
      </div>
      @if (fileError(); as msg) {
        <p class="mt-2 text-xs text-red-500">{{ msg }}</p>
      }
    </section>
  `,
})
export class ApplicationProfileImageComponent implements OnInit {
  private readonly service = inject(ProfileImageService);
  private readonly toast = inject(ToastService);

  readonly applicationId = input.required<string>();

  protected readonly reference = signal<string | null>(null);
  protected readonly loadingRef = signal(true);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly uploading = signal(false);

  ngOnInit(): void {
    this.loadReference();
  }

  protected onFileChange(event: Event): void {
    const selected = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fileError.set(null);
    if (!selected) {
      this.file.set(null);
      return;
    }
    if (!selected.type.startsWith('image/')) {
      this.file.set(null);
      this.fileError.set('El archivo debe ser una imagen.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      this.file.set(null);
      this.fileError.set('La imagen no puede superar 5 MB.');
      return;
    }
    this.file.set(selected);
  }

  protected upload(): void {
    const image = this.file();
    if (!image || this.uploading()) return;
    this.uploading.set(true);
    this.service.upload(this.applicationId(), image).subscribe({
      next: (res) => {
        this.reference.set(res.ref);
        this.file.set(null);
        this.uploading.set(false);
        this.toast.success('Imagen subida correctamente');
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error('Error al subir la imagen');
      },
    });
  }

  private loadReference(): void {
    this.service.getReference(this.applicationId()).subscribe({
      next: (res) => {
        this.reference.set(res.ref ?? null);
        this.loadingRef.set(false);
      },
      error: () => this.loadingRef.set(false),
    });
  }
}
