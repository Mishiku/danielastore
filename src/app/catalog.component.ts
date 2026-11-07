import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from './products.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent {
  @Input() categories: string[] = [];
  @Input() selectedCategory = '';
  @Input() filteredProducts: Product[] = [];
  @Input() favoriteNames = new Set<string>();

  @Output() categorySelected = new EventEmitter<string>();
  @Output() favoriteToggled = new EventEmitter<string>();
  @Output() productAdded = new EventEmitter<Product>();
}
