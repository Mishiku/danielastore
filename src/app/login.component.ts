import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <a routerLink="/" class="text-link">← Volver a la tienda</a>
      <section class="auth-card">
        <p class="eyebrow">Bienvenida a Daniela</p>
        <h1>Inicia sesión</h1>
        <p class="auth-intro">Accede a tu cuenta para guardar tus piezas favoritas.</p>
        <form (ngSubmit)="submit()" #loginForm="ngForm">
          <label>Correo electrónico<input name="email" type="email" [(ngModel)]="email" required autocomplete="email"></label>
          <label>Contraseña<input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password"></label>
          <p class="form-error" *ngIf="error">{{ error }}</p>
          <button class="primary-button auth-submit" type="submit" [disabled]="loginForm.invalid || loading">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: ({ user }) => this.router.navigateByUrl(
        user.role === 'admin' ? '/admin' : (this.route.snapshot.queryParamMap.get('returnUrl') ?? '/')
      ),
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? 'No pudimos iniciar sesión.';
        this.loading = false;
      }
    });
  }
}
