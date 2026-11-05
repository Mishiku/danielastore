import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { environment } from '../environments/environment';

interface OrderResponse { id: number; }

const apiBaseUrl = `${environment.apiBaseUrl}/api`;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="checkout-page">
      <a routerLink="/" class="text-link">← Volver a la tienda</a>
      <div class="checkout-heading">
        <div><p class="eyebrow">Tu selección</p><h1>Tu bolsa</h1></div>
        <span>{{ cart.products.length }} {{ cart.products.length === 1 ? 'pieza' : 'piezas' }}</span>
      </div>
      <section class="checkout-layout" *ngIf="cart.products.length; else emptyCart">
        <div class="checkout-products">
          <article class="checkout-product" *ngFor="let product of cart.products; let index = index">
            <img [src]="product.image" [alt]="product.name">
            <div><h2>{{ product.name }}</h2><p>{{ product.category }}</p></div>
            <strong>&#36;{{ product.price | number:'1.2-2' }}</strong>
            <button type="button" class="remove-button" (click)="remove(index)" [attr.aria-label]="'Eliminar ' + product.name">×</button>
          </article>
        </div>
        <aside class="checkout-summary">
          <h2>Resumen</h2>
          <div class="summary-row"><span>Subtotal</span><strong>&#36;{{ total | number:'1.2-2' }}</strong></div>
          <div class="summary-total"><span>Total</span><strong>&#36;{{ total | number:'1.2-2' }}</strong></div>
          <form (ngSubmit)="submit()" #orderForm="ngForm">
            <label>Teléfono para contactarte
              <input name="phone" type="tel" [(ngModel)]="phone" required pattern="^[0-9+() .-]{7,20}$" autocomplete="tel" placeholder="+52 555 123 4567">
            </label>
            <p class="form-error" *ngIf="error">{{ error }}</p>
            <button class="primary-button checkout-submit" type="submit" [disabled]="orderForm.invalid || submitting">{{ submitting ? 'Enviando...' : 'Enviar compra' }}</button>
          </form>
        </aside>
      </section>
      <ng-template #emptyCart>
        <section class="empty-checkout"><h2>Tu bolsa está vacía</h2><p>Agrega una pieza para comenzar tu compra.</p><a routerLink="/" class="primary-button">Explora la colección</a></section>
      </ng-template>
    </main>
  `
})
export class CheckoutComponent {
  phone = '';
  error = '';
  submitting = false;

  constructor(
    readonly cart: CartService,
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  get total(): number {
    return this.cart.products.reduce((sum, product) => sum + product.price, 0);
  }

  remove(index: number): void { this.cart.remove(index); }

  submit(): void {
    if (!this.auth.user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.submitting = true;
    this.error = '';
    const products = this.cart.products.map(({ id }) => id);
    this.http.post<OrderResponse>(`${apiBaseUrl}/orders`, { phone: this.phone.trim(), products }, {
      headers: { Authorization: 'Bearer ' + (this.auth.token ?? '') }
    }).subscribe({
      next: () => {
        this.cart.clear();
        this.router.navigateByUrl('/');
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? 'No pudimos enviar tu compra.';
        this.submitting = false;
      }
    });
  }
}
