import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FederationService } from '@core/services/federation.service';

/** Solo se vuelve a una ruta de este sitio: una sola `/` inicial, sin barra invertida ni caracteres de control. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\t]/.test(value)) return '/dashboard';
  return value;
}

/**
 * Última parada del acceso con un proveedor: el BFF redirige aquí con un ticket de un solo uso; se cambia por la sesión y se va
 * a la ruta pedida. Sin ticket válido se vuelve al acceso con el aviso «expiró».
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-federation-complete',
  standalone: true,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p class="text-sm text-gray-600 dark:text-gray-300" role="status">Completando el inicio de sesión…</p>
    </div>
  `,
})
export class FederationCompleteComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly federation = inject(FederationService);
  private readonly router = inject(Router);

  /** `?ticket=` lo deja el BFF; se cambia una sola vez. */
  readonly ticket = input<string>();
  /** `?returnTo=` la ruta a la que volver (se vuelve a validar aquí). */
  readonly returnTo = input<string>();

  ngOnInit(): void {
    const ticket = this.ticket();
    if (!ticket) {
      void this.router.navigate(['/auth/login'], { queryParams: { error: 'expired' } });
      return;
    }
    this.federation
      .exchange(ticket)
      .pipe(catchError(() => of(null)))
      .subscribe((session) => {
        if (session?.token) {
          this.auth.startFederatedSession(session);
          void this.router.navigateByUrl(safeReturnTo(this.returnTo()));
        } else {
          void this.router.navigate(['/auth/login'], { queryParams: { error: 'expired' } });
        }
      });
  }
}
