import { countProducts, insertProduct } from './products.repository';
import type { NewProduct } from './products.types';

const seedProducts: NewProduct[] = [
  {
    name: 'Collar de oro',
    category: 'Collares',
    price: 540,
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
    color: '#f8e5b0',
    badge: 'Nuevo'
  },
  {
    name: 'Anillo clásico',
    category: 'Anillos',
    price: 420,
    image: 'https://images.unsplash.com/photo-1601821765780-754fa98637c1?auto=format&fit=crop&w=900&q=80',
    color: '#e9d7a7',
    badge: 'Top'
  },
  {
    name: 'Aretes finos',
    category: 'Aretes',
    price: 390,
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=900&q=80',
    color: '#f0d7c5',
    badge: 'Popular'
  }
];

export async function seedProductsIfEmpty() {
  if ((await countProducts()) > 0) return;
  for (const product of seedProducts) {
    await insertProduct(product);
  }
}
