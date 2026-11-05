import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  color: string;
  badge?: string;
}

const apiBaseUrl = `${environment.apiBaseUrl}/api`;

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${apiBaseUrl}/products`);
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${apiBaseUrl}/products`, product, {
      headers: { Authorization: 'Bearer ' + (this.auth.token ?? '') }
    });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${apiBaseUrl}/products/${id}`, {
      headers: { Authorization: 'Bearer ' + (this.auth.token ?? '') }
    });
  }
}
