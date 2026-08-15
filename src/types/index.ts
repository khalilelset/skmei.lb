export interface ProductColor {
  name: string;
  hex: string;
}

// Product Types
export interface PriceTier {
  qty: number;
  price: number; // total price for this many units
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice?: number;
  originalPrice?: number;
  priceTiers?: PriceTier[];
  images: string[];
  category: string;
  brand: string;
  sku: string;
  stock: number;
  features: string[];
  specifications: ProductSpecifications;
  videoUrl?: string | null;
  isNew?: boolean;
  onSale?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isVisible?: boolean;
  gender?: 'men' | 'women' | 'unisex';
  isCouple?: boolean;
  colors?: ProductColor[];
  sortOrder?: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecifications {
  movement: string;
  caseMaterial: string;
  bandMaterial: string;
  dialColor: string;
  caseSize: string;
  waterResistance: string;
  warranty: string;
  [key: string]: string;
}

// Sunglasses Types
export interface SunglassesVariant {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  videoUrl?: string | null;
}

export interface Sunglasses {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: number;
  originalPrice?: number;
  stock: number;
  gender?: 'men' | 'women' | 'unisex';
  isNew?: boolean;
  isBestseller?: boolean;
  onSale?: boolean;
  isVisible?: boolean;
  features: string[];
  specifications: Record<string, string>;
  variants: SunglassesVariant[];
  videoUrl?: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

// Box Types
export interface Box {
  id: string;
  code: string;
  type: 'standard' | 'gift';
  price: number;
  image: string;
  brandId: string | null;
  createdAt: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedBox?: Box;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  discount?: number;
  couponCode?: string | null;
  total: number;
  shippingAddress: Address;
  paymentMethod: string;
  source?: 'website' | 'whatsapp';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  quantity: number;
  price: number;
  box?: { code?: string; type: string; price: number; image?: string | null } | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

// Customer Types
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  building?: string;
  area?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
}

// Admin Dashboard Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  gender?: 'men' | 'women' | 'unisex';
  sortBy?: "price-asc" | "price-desc" | "newest" | "popular";
  search?: string;
  brands?: string[];
  coupleOnly?: boolean;
}
