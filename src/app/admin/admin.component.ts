import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product, ProductsService } from '../services/products/products.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="admin-page">
      <div class="admin-heading">
        <div><p class="eyebrow">Administración</p><h1>{{ activeTab === 'products' ? 'Productos' : 'Calculadora de precios' }}</h1></div>
        <div class="admin-actions"><span>{{ auth.user?.email }}</span><a routerLink="/" class="text-link">Ver tienda</a><button type="button" class="secondary-button" (click)="logout()">Cerrar sesión</button></div>
      </div>
      <nav class="admin-tabs" aria-label="Secciones de administración">
        <button type="button" [class.active]="activeTab === 'products'" (click)="selectTab('products')">Productos</button>
        <button type="button" [class.active]="activeTab === 'calculator'" (click)="selectTab('calculator')">Calculadora de precios</button>
      </nav>
      <section class="admin-layout" *ngIf="activeTab === 'products'">
        <form class="admin-form" (ngSubmit)="addProduct()" #productForm="ngForm">
          <h2>Añadir pieza</h2>
          <label>Nombre<input name="name" [(ngModel)]="draft.name" required></label>
          <label>Categoría<select name="category" [(ngModel)]="draft.category"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
          <label>Precio<input name="price" type="number" min="0" step="0.01" [(ngModel)]="draft.price" required></label>
          <div class="image-dropzone" [class.dragging]="isDragging" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
            <input #imageInput class="image-file-input" type="file" accept="image/png,image/jpeg,image/webp" (change)="onFileSelected($event)">
            <ng-container *ngIf="!imagePreview; else imageSelected">
              <strong>Arrastra una imagen aquí</strong>
              <span>o <button type="button" class="text-link" (click)="imageInput.click()">elige un archivo</button></span>
              <small>PNG, JPG o WEBP · hasta 5 MB</small>
            </ng-container>
            <ng-template #imageSelected>
              <img class="image-preview" [src]="imagePreview" alt="Vista previa de la imagen del producto">
              <button type="button" class="remove-image" (click)="clearImage()">Quitar imagen</button>
            </ng-template>
          </div>
          <p class="form-error" *ngIf="error">{{ error }}</p>
          <button class="primary-button" type="submit" [disabled]="productForm.invalid || saving">{{ saving ? 'Guardando…' : 'Añadir al catálogo' }}</button>
        </form>
        <div class="admin-products">
          <h2>Catálogo actual <span>{{ products.length }}</span></h2>
          <div class="admin-product-item" *ngFor="let product of products">
            <div class="admin-product">
              <img [src]="product.image" [alt]="product.name">
              <div class="admin-product-info"><strong>{{ product.name }}</strong><small>{{ product.category }} · &#36;{{ product.price }}</small></div>
              <div class="admin-product-actions">
                <button type="button" class="edit-button" (click)="startEditing(product)" [disabled]="savingEdit">Editar</button>
                <button type="button" class="delete-button" (click)="removeProduct(product)" [disabled]="savingEdit">Eliminar</button>
              </div>
            </div>
            <form class="admin-product-edit" *ngIf="editingProductId === product.id" (ngSubmit)="saveProductEdit(product)" #editForm="ngForm">
              <label>Nombre<input name="name" [(ngModel)]="editDraft.name" required></label>
              <label>Categoría<select name="category" [(ngModel)]="editDraft.category" required><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
              <label>Precio<input name="price" type="number" min="0" step="0.01" [(ngModel)]="editDraft.price" required></label>
              <p class="form-error" *ngIf="editError">{{ editError }}</p>
              <div class="admin-product-edit-actions">
                <button class="primary-button" type="submit" [disabled]="editForm.invalid || savingEdit">{{ savingEdit ? 'Guardando…' : 'Guardar cambios' }}</button>
                <button class="secondary-button" type="button" (click)="cancelEditing()" [disabled]="savingEdit">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <section class="admin-layout calculator-layout" *ngIf="activeTab === 'calculator'">
        <form class="admin-form calculator-form">
          <h2>Calculadora de precios</h2>
          <label>Precio oro<input name="goldPrice" type="number" min="0" step="0.01" [(ngModel)]="goldPrice" (ngModelChange)="saveGoldPrice($event)"></label>
          <label>Peso pieza<input name="pieceWeight" type="number" min="0" step="0.01" [(ngModel)]="pieceWeight"></label>
          <p class="piece-price" *ngIf="piecePrice !== null"><span>Precio pieza</span><strong>{{ piecePrice | number:'1.2-2' }}</strong></p>
        </form>
      </section>
    </main>
  `
})
export class AdminComponent implements OnInit {
  private readonly goldPriceStorageKey = 'daniela-gold-price';
  readonly categories = ['Collares', 'Anillos', 'Aretes', 'Pulseras'];
  activeTab: 'products' | 'calculator' = 'products';
  goldPrice: number | null = null;
  pieceWeight: number | null = null;
  products: Product[] = [];
  saving = false;
  savingEdit = false;
  error = '';
  editError = '';
  editingProductId: number | null = null;
  editDraft: Pick<Product, 'name' | 'category' | 'price'> = { name: '', category: 'Collares', price: 0 };
  isDragging = false;
  imagePreview = '';
  draft: Omit<Product, 'id'> = { name: '', category: 'Collares', price: 0, image: '', color: '#f8e5b0', badge: '' };

  constructor(
    readonly auth: AuthService,
    private readonly productsService: ProductsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    const savedGoldPrice = localStorage.getItem(this.goldPriceStorageKey);
    if (savedGoldPrice !== null && savedGoldPrice !== '') {
      const parsedGoldPrice = Number(savedGoldPrice);
      if (Number.isFinite(parsedGoldPrice)) this.goldPrice = parsedGoldPrice;
    }
  }

  get piecePrice(): number | null {
    if (this.goldPrice === null || this.pieceWeight === null) return null;
    return this.goldPrice * this.pieceWeight;
  }

  selectTab(tab: 'products' | 'calculator'): void {
    this.activeTab = tab;
  }

  saveGoldPrice(value: number | null): void {
    if (value === null || !Number.isFinite(value)) {
      localStorage.removeItem(this.goldPriceStorageKey);
      return;
    }
    localStorage.setItem(this.goldPriceStorageKey, String(value));
  }

  addProduct(): void {
    if (!this.draft.image) {
      this.error = 'Añade una URL o sube una imagen.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.productsService.createProduct(this.draft).subscribe({
      next: (product) => {
        this.products = [...this.products, product];
        this.draft = { name: '', category: 'Collares', price: 0, image: '', color: '#f8e5b0', badge: '' };
        this.imagePreview = '';
        this.saving = false;
      },
      error: () => { this.error = 'No se pudo añadir la pieza.'; this.saving = false; }
    });
  }

  startEditing(product: Product): void {
    this.editingProductId = product.id;
    this.editDraft = { name: product.name, category: product.category, price: product.price };
    this.editError = '';
  }

  cancelEditing(): void {
    this.editingProductId = null;
    this.editError = '';
  }

  saveProductEdit(product: Product): void {
    this.savingEdit = true;
    this.editError = '';
    this.productsService.updateProduct(product.id, this.editDraft).subscribe({
      next: (updatedProduct) => {
        this.products = this.products.map((item) => item.id === updatedProduct.id ? updatedProduct : item);
        this.cancelEditing();
        this.savingEdit = false;
      },
      error: () => {
        this.editError = 'No se pudieron guardar los cambios.';
        this.savingEdit = false;
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files.item(0);
    if (file) this.processImage(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) this.processImage(file);
    input.value = '';
  }

  clearImage(): void {
    this.draft.image = '';
    this.imagePreview = '';
  }

  private processImage(file: File): void {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      this.error = 'Elige una imagen PNG, JPG o WEBP.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'La imagen debe pesar menos de 5 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressedImage = canvas.toDataURL('image/jpeg', 0.82);
        this.draft.image = compressedImage;
        this.imagePreview = compressedImage;
        this.error = '';
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  removeProduct(product: Product): void {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    this.productsService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
        if (this.editingProductId === product.id) this.cancelEditing();
      },
      error: () => this.error = 'No se pudo eliminar la pieza.'
    });
  }

  logout(): void { this.auth.logout(); this.router.navigateByUrl('/'); }
  private loadProducts(): void {
    this.productsService.getProducts().subscribe({
      next: (products) => this.products = products,
      error: () => this.error = 'No se pudo cargar el catálogo.'
    });
  }
}
