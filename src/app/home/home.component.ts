import { Component, OnInit } from '@angular/core';
import { CatalogComponent } from '../catalog/catalog.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { CartService } from '../services/cart/cart.service';
import { Product, ProductsService } from '../services/products/products.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, CatalogComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  readonly categories = ['Todas las piezas', 'Collares', 'Anillos', 'Aretes', 'Pulseras'];
  selectedCategory = 'Todas las piezas';
  searchTerm = '';
  favoriteNames = new Set<string>();
  products: Product[] = [];

  constructor(
    readonly cart: CartService,
    private readonly productsService: ProductsService
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
}
