import { Injectable } from '@angular/core';
import { Product } from './products.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartKey = 'daniela_cart';
  private items: Product[] = this.readItems();

  get products(): Product[] {
    return [...this.items];
  }

  get count(): number {
    return this.items.length;
  }

  add(product: Product): void {
    this.items = [...this.items, product];
    this.persist();
  }

  remove(index: number): void {
    this.items = this.items.filter((_product, itemIndex) => itemIndex !== index);
    this.persist();
  }

  clear(): void {
    this.items = [];
    this.persist();
  }

  private readItems(): Product[] {
    const stored = localStorage.getItem(this.cartKey);
    if (!stored) return [];
    try {
      const items = JSON.parse(stored) as Product[];
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    localStorage.setItem(this.cartKey, JSON.stringify(this.items));
  }
}
