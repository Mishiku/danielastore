import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { Product, ProductsService } from './products.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './app.component.css'
})
export class HomeComponent implements OnInit {
  readonly categories = ['Todas las piezas', 'Collares', 'Anillos', 'Aretes', 'Pulseras'];
  selectedCategory = 'Todas las piezas';
  searchTerm = '';
  favoriteNames = new Set<string>();
  products: Product[] = [];

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    private readonly productsService: ProductsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.productsService.getProducts().subscribe({
      next: (products) => this.products = products,
      error: (error: unknown) => console.error('Unable to load products', error)
    });
  }

  get filteredProducts(): Product[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.products.filter((product) => {
      const matchesCategory = this.selectedCategory === 'Todas las piezas' || product.category === this.selectedCategory;
      const matchesSearch = !query || `${product.name} ${product.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }

  selectCategory(category: string): void { this.selectedCategory = category; }
  addToBag(product: Product): void { this.cart.add(product); }
  toggleFavorite(name: string): void {
    if (this.favoriteNames.has(name)) this.favoriteNames.delete(name);
    else this.favoriteNames.add(name);
  }
  isFavorite(name: string): boolean { return this.favoriteNames.has(name); }
  logout(): void { this.auth.logout(); this.router.navigateByUrl('/'); }
}
