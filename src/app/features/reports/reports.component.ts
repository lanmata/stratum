import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '@core/services/report.service';
import { ToastService } from '@core/services/toast.service';
import { downloadBlob } from '@shared/utils/download.util';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

export const DOCX_EXTENSION = '.docx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="mb-6">
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Reportes</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Genera un documento Word a partir de una plantilla .docx con marcadores de posición.
        </p>
      </div>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">1. Plantilla</h2>
        <input
          type="file"
          accept=".docx"
          aria-label="Plantilla Word"
          (change)="onFileChange($event)"
          class="block text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:hover:file:bg-gray-600"
        />
        @if (fileError(); as msg) {
          <p class="mt-2 text-xs text-red-500">{{ msg }}</p>
        }

        @if (template(); as file) {
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="report-name">Nombre de la plantilla</label>
              <input id="report-name" type="text" [ngModel]="templateName()" (ngModelChange)="templateName.set($event)" [class]="inputClass" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" for="report-description">Descripción</label>
              <input id="report-description" type="text" [ngModel]="description()" (ngModelChange)="description.set($event)" [class]="inputClass" />
            </div>
          </div>
          <button
            type="button"
            (click)="detectPlaceholders(file)"
            [disabled]="detecting()"
            class="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {{ detecting() ? 'Analizando…' : 'Detectar marcadores' }}
          </button>
        }
      </section>

      @if (placeholders(); as names) {
        <section class="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">2. Valores</h2>
          @if (names.length === 0) {
            <p class="text-sm text-gray-500 dark:text-gray-400">La plantilla no contiene marcadores de posición.</p>
          } @else {
            <div class="grid gap-3 sm:grid-cols-2">
              @for (name of names; track name) {
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300" [attr.for]="'ph-' + name">{{ name }}</label>
                  <input
                    [id]="'ph-' + name"
                    type="text"
                    [ngModel]="values()[name] ?? ''"
                    (ngModelChange)="setValue(name, $event)"
                    [class]="inputClass"
                  />
                </div>
              }
            </div>
          }
        </section>
      }

      @if (template()) {
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            (click)="generate()"
            [disabled]="generating()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ generating() ? 'Generando…' : 'Generar documento' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ReportsComponent {
  private readonly service = inject(ReportService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly inputClass = INPUT_CLASS;
  protected readonly template = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly templateName = signal('');
  protected readonly description = signal('');
  protected readonly placeholders = signal<string[] | null>(null);
  protected readonly values = signal<Record<string, string>>({});
  protected readonly detecting = signal(false);
  protected readonly generating = signal(false);

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fileError.set(null);
    this.placeholders.set(null);
    this.values.set({});
    if (!file) {
      this.template.set(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(DOCX_EXTENSION)) {
      this.template.set(null);
      this.fileError.set('La plantilla debe ser un archivo .docx.');
      return;
    }
    this.template.set(file);
    this.templateName.set(file.name.slice(0, -DOCX_EXTENSION.length));
  }

  protected setValue(name: string, value: string): void {
    this.values.update((v) => ({ ...v, [name]: value }));
  }

  protected detectPlaceholders(file: File): void {
    if (this.detecting()) return;
    this.detecting.set(true);
    this.service
      .placeholders(file, {
        templateName: this.templateName() || null,
        description: this.description() || null,
      })
      .subscribe({
        next: (names) => {
          this.placeholders.set(names);
          this.values.set(Object.fromEntries(names.map((n) => [n, ''])));
          this.detecting.set(false);
        },
        error: () => {
          this.toast.error('Error al analizar la plantilla');
          this.detecting.set(false);
        },
      });
  }

  protected generate(): void {
    const file = this.template();
    if (!file || this.generating() || !isPlatformBrowser(this.platformId)) return;
    this.generating.set(true);
    this.service.generate(file, this.values()).subscribe({
      next: (blob) => {
        downloadBlob(blob, `${this.templateName() || 'documento'}${DOCX_EXTENSION}`);
        this.generating.set(false);
        this.toast.success('Documento generado');
      },
      error: () => {
        this.toast.error('Error al generar el documento');
        this.generating.set(false);
      },
    });
  }
}
