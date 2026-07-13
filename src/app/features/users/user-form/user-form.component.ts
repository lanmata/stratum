import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { Role } from '@shared/models/role.model';
import { UserTO } from '@shared/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div class="mb-6">
        <a [routerLink]="['/applications', applicationId, 'users']" class="text-sm text-blue-600 hover:underline">← Usuarios</a>
        <h1 class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ isEdit() ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h1>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="mx-auto max-w-2xl space-y-6">

          <!-- Sección 1: Datos Básicos -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Datos Básicos
            </h2>
            <div class="space-y-4">

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Alias -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alias @if (!isEdit()) { <span class="text-red-500">*</span> }
                  </label>
                  <input
                    formControlName="alias"
                    type="text"
                    maxlength="64"
                    placeholder="nombre_usuario"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:disabled:bg-gray-600"
                    [class.border-red-400]="form.controls.alias.invalid && form.controls.alias.touched"
                    [class.border-green-400]="form.controls.alias.valid && form.controls.alias.dirty && !isEdit()"
                  />
                  @if (form.controls.alias.pending) {
                    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Verificando disponibilidad…</p>
                  }
                  @if (form.controls.alias.invalid && form.controls.alias.touched) {
                    @if (form.controls.alias.errors?.['required']) {
                      <p class="mt-1 text-xs text-red-500">El alias es obligatorio.</p>
                    }
                    @if (form.controls.alias.errors?.['aliasUnavailable']) {
                      <p class="mt-1 text-xs text-red-500">Este alias ya está en uso.</p>
                    }
                  }
                  @if (form.controls.alias.valid && form.controls.alias.dirty && !isEdit()) {
                    <p class="mt-1 text-xs text-green-600">Alias disponible.</p>
                  }
                </div>

                <!-- Display Name -->
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre de Visualización <span class="text-red-500">*</span>
                  </label>
                  <input
                    formControlName="displayName"
                    type="text"
                    maxlength="256"
                    placeholder="Nombre completo o apodo"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    [class.border-red-400]="form.controls.displayName.invalid && form.controls.displayName.touched"
                  />
                  @if (form.controls.displayName.invalid && form.controls.displayName.touched) {
                    <p class="mt-1 text-xs text-red-500">El nombre es obligatorio.</p>
                  }
                </div>
              </div>

              <!-- Email -->
              @if (!isEdit()) {
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span class="text-red-500">*</span>
                  </label>
                  <input
                    formControlName="email"
                    type="email"
                    placeholder="usuario@dominio.com"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    [class.border-red-400]="form.controls.email.invalid && form.controls.email.touched"
                    [class.border-green-400]="form.controls.email.valid && form.controls.email.dirty"
                  />
                  @if (form.controls.email.pending) {
                    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Verificando disponibilidad…</p>
                  }
                  @if (form.controls.email.invalid && form.controls.email.touched) {
                    @if (form.controls.email.errors?.['required']) {
                      <p class="mt-1 text-xs text-red-500">El email es obligatorio.</p>
                    } @else if (form.controls.email.errors?.['email']) {
                      <p class="mt-1 text-xs text-red-500">Formato de email inválido.</p>
                    } @else if (form.controls.email.errors?.['emailUnavailable']) {
                      <p class="mt-1 text-xs text-red-500">Este email ya está registrado.</p>
                    }
                  }
                  @if (form.controls.email.valid && form.controls.email.dirty) {
                    <p class="mt-1 text-xs text-green-600">Email disponible.</p>
                  }
                </div>
              }

              <!-- Estado + Toggles -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                @if (isEdit()) {
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      (click)="form.controls.active.setValue(!form.controls.active.value)"
                      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                      [class]="form.controls.active.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                    >
                      <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                        [class]="form.controls.active.value ? 'translate-x-6' : 'translate-x-1'"
                      ></span>
                    </button>
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ form.controls.active.value ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                }

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="form.controls.notificationEmail.setValue(!form.controls.notificationEmail.value)"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                    [class]="form.controls.notificationEmail.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                      [class]="form.controls.notificationEmail.value ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                  <span class="text-sm text-gray-700 dark:text-gray-300">Notificaciones por email</span>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="form.controls.notificationSms.setValue(!form.controls.notificationSms.value)"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                    [class]="form.controls.notificationSms.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                      [class]="form.controls.notificationSms.value ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                  <span class="text-sm text-gray-700 dark:text-gray-300">Notificaciones por SMS</span>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="form.controls.privacyDataOutActive.setValue(!form.controls.privacyDataOutActive.value)"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none"
                    [class]="form.controls.privacyDataOutActive.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                      [class]="form.controls.privacyDataOutActive.value ? 'translate-x-6' : 'translate-x-1'"
                    ></span>
                  </button>
                  <span class="text-sm text-gray-700 dark:text-gray-300">Privacidad — datos externos</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Sección 2: Contraseña -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              (click)="showPassword.set(!showPassword())"
              class="flex w-full items-center justify-between px-6 py-4"
            >
              <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ isEdit() ? 'Cambiar Contraseña' : 'Contraseña' }}
              </h2>
              <svg
                class="h-4 w-4 text-gray-400 transition-transform dark:text-gray-500"
                [class.rotate-180]="showPassword()"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (showPassword()) {
              <div class="border-t border-gray-100 px-6 pb-6 pt-4 dark:border-gray-700">
                <input
                  formControlName="password"
                  type="password"
                  placeholder="{{ isEdit() ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres' }}"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  [class.border-red-400]="form.controls.password.invalid && form.controls.password.touched"
                />
                @if (form.controls.password.invalid && form.controls.password.touched) {
                  @if (form.controls.password.errors?.['required']) {
                    <p class="mt-1 text-xs text-red-500">La contraseña es obligatoria.</p>
                  } @else if (form.controls.password.errors?.['minlength']) {
                    <p class="mt-1 text-xs text-red-500">Mínimo 8 caracteres.</p>
                  }
                }
              </div>
            }
          </div>

          <!-- Sección 3: Datos de Persona -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Datos de Persona
            </h2>
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre <span class="text-red-500">*</span>
                  </label>
                  <input
                    formControlName="firstName"
                    type="text"
                    placeholder="Nombre"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    [class.border-red-400]="form.controls.firstName.invalid && form.controls.firstName.touched"
                  />
                  @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
                    <p class="mt-1 text-xs text-red-500">El nombre es obligatorio.</p>
                  }
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apellido <span class="text-red-500">*</span>
                  </label>
                  <input
                    formControlName="lastName"
                    type="text"
                    placeholder="Apellido"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    [class.border-red-400]="form.controls.lastName.invalid && form.controls.lastName.touched"
                  />
                  @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
                    <p class="mt-1 text-xs text-red-500">El apellido es obligatorio.</p>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Segundo Nombre
                  </label>
                  <input
                    formControlName="middleName"
                    type="text"
                    placeholder="Opcional"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                  <select
                    formControlName="gender"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Sin especificar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Nacimiento
                  </label>
                  <input
                    formControlName="birthdate"
                    type="date"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Sección 4: Rol(es) -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {{ isEdit() ? 'Gestión de Roles' : 'Rol Inicial' }}
            </h2>

            @if (!isEdit()) {
              <!-- Create: single role select -->
              <select
                formControlName="roleId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                [class.border-red-400]="form.controls.roleId.invalid && form.controls.roleId.touched"
              >
                <option value="">— Seleccionar rol —</option>
                @for (role of allRoles(); track role.id) {
                  <option [value]="role.id">{{ role.name }}</option>
                }
              </select>
              @if (form.controls.roleId.invalid && form.controls.roleId.touched) {
                <p class="mt-1 text-xs text-red-500">Debes seleccionar un rol.</p>
              }
            } @else {
              <!-- Edit: checkboxes -->
              @if (allRoles().length === 0) {
                <p class="text-xs text-gray-400 dark:text-gray-500">No hay roles disponibles.</p>
              } @else {
                <div class="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  @for (role of allRoles(); track role.id) {
                    <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <input
                        type="checkbox"
                        [checked]="selectedRoleIds().has(role.id)"
                        (change)="toggleRole(role.id)"
                        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500"
                      />
                      <span class="flex-1 text-sm text-gray-800 dark:text-gray-200">{{ role.name }}</span>
                      @if (!role.active) {
                        <span class="text-xs text-gray-400 dark:text-gray-500">Inactivo</span>
                      }
                    </label>
                  }
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ selectedRoleIds().size }} rol(es) seleccionado(s)
                </p>
              }
            }
          </div>

          <!-- Acciones -->
          <div class="flex justify-end gap-3">
            <a
              [routerLink]="['/applications', applicationId, 'users']"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </a>
            <button
              type="submit"
              [disabled]="form.invalid || form.pending || saving()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving() ? 'Guardando…' : isEdit() ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>

        </form>
      }
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly applicationId = this.route.snapshot.paramMap.get('applicationId')!;
  private userId: string | null = null;

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly allRoles = signal<Role[]>([]);
  protected readonly selectedRoleIds = signal<Set<string>>(new Set());
  private readonly initialRoleIds = signal<Set<string>>(new Set());

  protected readonly form = this.fb.nonNullable.group({
    alias: ['', Validators.required],
    displayName: ['', [Validators.required, Validators.maxLength(256)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    active: [true],
    notificationEmail: [false],
    notificationSms: [false],
    privacyDataOutActive: [false],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    middleName: [''],
    gender: [''],
    birthdate: [''],
    roleId: [''],
  });

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId');

    if (this.userId) {
      this.isEdit.set(true);
      this.form.controls.alias.disable();
      this.form.controls.email.disable();
      this.form.controls.alias.clearValidators();
      this.form.controls.email.clearValidators();

      forkJoin({
        user: this.userService.getById(this.userId),
        roles: this.roleService.getAll(),
      }).subscribe({
        next: ({ user, roles }) => {
          this.allRoles.set(roles);
          this.patchFromUser(user);
          this.loading.set(false);
          this.showPassword.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar el usuario');
          this.router.navigate(['/applications', this.applicationId, 'users']);
        },
      });
    } else {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(8)]);
      this.form.controls.roleId.addValidators(Validators.required);
      this.form.controls.alias.setAsyncValidators(this.aliasAvailabilityValidator());
      this.form.controls.email.setAsyncValidators(this.emailAvailabilityValidator());
      this.form.controls.alias.updateValueAndValidity();
      this.form.controls.email.updateValueAndValidity();
      this.showPassword.set(true);

      this.roleService.getAll().subscribe({
        next: (roles) => {
          this.allRoles.set(roles);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private patchFromUser(user: UserTO): void {
    this.form.patchValue({
      alias: user.alias,
      displayName: user.displayName ?? '',
      active: user.active,
      notificationEmail: user.notificationEmail,
      notificationSms: user.notificationSms,
      privacyDataOutActive: user.privacyDataOutActive,
      firstName: user.person?.firstName ?? '',
      lastName: user.person?.lastName ?? '',
      middleName: user.person?.middleName ?? '',
      gender: user.person?.gender ?? '',
      birthdate: user.person?.birthdate ?? '',
    });
    const roleIds = new Set((user.roles ?? []).map((r) => r.id));
    this.selectedRoleIds.set(roleIds);
    this.initialRoleIds.set(new Set(roleIds));
  }

  protected toggleRole(roleId: string): void {
    this.selectedRoleIds.update((set) => {
      const next = new Set(set);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.form.pending || this.saving()) return;
    this.saving.set(true);

    if (this.isEdit() && this.userId) {
      this.submitEdit(this.userId);
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const v = this.form.getRawValue();
    this.userService
      .create({
        alias: v.alias,
        displayName: v.displayName,
        email: v.email,
        password: v.password,
        active: v.active,
        notificationEmail: v.notificationEmail,
        notificationSms: v.notificationSms,
        privacyDataOutActive: v.privacyDataOutActive,
        roleId: v.roleId,
        applicationId: this.applicationId,
        person: {
          firstName: v.firstName,
          lastName: v.lastName,
          ...(v.middleName ? { middleName: v.middleName } : {}),
          ...(v.gender ? { gender: v.gender } : {}),
          ...(v.birthdate ? { birthdate: v.birthdate } : {}),
        },
      })
      .subscribe({
        next: (response) => {
          const warningHeader = response.headers.get('Warning');
          if (warningHeader) {
            const warnings = [
              ...new Set(
                warningHeader
                  .split(/[;,]/)
                  .map((w) => w.trim())
                  .filter(Boolean),
              ),
            ].join('; ');
            this.toast.warning(warnings);
          }
          this.toast.success(`Usuario creado con ID: ${response.body!.id}`);
          this.router.navigate(['/applications', this.applicationId, 'users']);
        },
        error: (err: HttpErrorResponse) => {
          const warningHeader = err.headers?.get('Warning');
          if (warningHeader) {
            const warnings = [
              ...new Set(
                warningHeader
                  .split(/[;,]/)
                  .map((w) => w.trim())
                  .filter(Boolean),
              ),
            ].join('; ');
            this.toast.warning(warnings);
          } else {
            this.toast.error('Error al crear el usuario');
          }
          this.saving.set(false);
        },
      });
  }

  private submitEdit(userId: string): void {
    const v = this.form.getRawValue();

    this.userService
      .update(userId, {
        userId,
        displayName: v.displayName,
        active: v.active,
        notificationEmail: v.notificationEmail,
        notificationSms: v.notificationSms,
        privacyDataOutActive: v.privacyDataOutActive,
        firstName: v.firstName,
        lastName: v.lastName,
        ...(v.middleName ? { middleName: v.middleName } : {}),
        ...(v.gender ? { gender: v.gender } : {}),
        ...(v.birthdate ? { birthdate: v.birthdate } : {}),
        ...(v.password ? { password: v.password } : {}),
        application: this.applicationId,
      })
      .pipe(
        switchMap(() => {
          const initial = this.initialRoleIds();
          const selected = this.selectedRoleIds();
          const toLink = [...selected].filter((id) => !initial.has(id));
          const toUnlink = [...initial].filter((id) => !selected.has(id));
          const ops = [
            ...toLink.map((id) => this.userService.linkRole(userId, id)),
            ...toUnlink.map((id) => this.userService.unlinkRole(userId, id)),
          ];
          return ops.length > 0 ? forkJoin(ops) : of([]);
        })
      )
      .subscribe({
        next: () => {
          this.toast.success('Usuario actualizado correctamente');
          this.router.navigate(['/applications', this.applicationId, 'users']);
        },
        error: () => {
          this.toast.error('Error al actualizar el usuario');
          this.saving.set(false);
        },
      });
  }

  private aliasAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value as string;
      if (!value || value.length < 2) return of(null);
      return timer(400).pipe(
        switchMap(() => this.userService.checkAlias(value, this.applicationId)),
        map(() => null),
        catchError((err: HttpErrorResponse) =>
          of(err.status === 404 ? { aliasUnavailable: true } : null)
        )
      );
    };
  }

  private emailAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value as string;
      if (!value || !value.includes('@')) return of(null);
      return timer(400).pipe(
        switchMap(() => this.userService.checkEmail(value, this.applicationId)),
        map(() => null),
        catchError((err: HttpErrorResponse) =>
          of(err.status === 404 ? { emailUnavailable: true } : null)
        )
      );
    };
  }
}
