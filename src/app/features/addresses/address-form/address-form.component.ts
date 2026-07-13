import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AddressService } from '@core/services/address.service';
import { ToastService } from '@core/services/toast.service';
import { AddressRequest } from '@shared/models/address.model';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a [routerLink]="['/people', personId, 'addresses']" class="text-sm text-blue-600 hover:underline">
          ← Direcciones
        </a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEditMode() ? 'Editar Dirección' : 'Nueva Dirección' }}
        </h1>
      </div>

      <div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        @if (loadingData()) {
          <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección <span class="text-red-500">*</span>
              </label>
              <textarea
                formControlName="address"
                rows="3"
                maxlength="500"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="form.controls.address.invalid && form.controls.address.touched"
              ></textarea>
              @if (form.controls.address.invalid && form.controls.address.touched) {
                <p class="mt-1 text-xs text-red-500">La dirección es obligatoria</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código Postal
              </label>
              <input
                formControlName="zipcode"
                type="text"
                maxlength="20"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <a
                [routerLink]="['/people', personId, 'addresses']"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </a>
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class AddressFormComponent implements OnInit {
  private readonly service = inject(AddressService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly personId = this.route.snapshot.paramMap.get('personId')!;
  protected readonly isEditMode = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly saving = signal(false);

  private addressId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    address: ['', [Validators.required, Validators.maxLength(500)]],
    zipcode: ['', Validators.maxLength(20)],
  });

  ngOnInit(): void {
    this.addressId = this.route.snapshot.paramMap.get('addressId');
    if (this.addressId) {
      this.isEditMode.set(true);
      this.loadForEdit(this.addressId);
    }
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const { address, zipcode } = this.form.getRawValue();
    const req: AddressRequest = {
      address: {
        id: this.addressId ?? '',
        personId: this.personId,
        address,
        zipcode: zipcode || undefined,
      },
    };

    const call = this.isEditMode()
      ? this.service.update(this.addressId!, req)
      : this.service.create(req);

    call.subscribe({
      next: () => {
        this.toast.success(this.isEditMode() ? 'Dirección actualizada' : 'Dirección creada');
        this.router.navigate(['/people', this.personId, 'addresses']);
      },
      error: () => {
        this.toast.error('Error al guardar la dirección');
        this.saving.set(false);
      },
    });
  }

  private loadForEdit(id: string): void {
    this.loadingData.set(true);
    this.service.getById(id).subscribe({
      next: (addr) => {
        this.form.setValue({
          address: addr.address,
          zipcode: addr.zipcode ?? '',
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la dirección');
        this.router.navigate(['/people', this.personId, 'addresses']);
      },
    });
  }
}
