export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  color: string;
  badge: string | null;
}

export type NewProduct = Omit<Product, 'id'>;
