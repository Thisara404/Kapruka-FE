// Thisari — Shared TypeScript types

/** Product from search results */
export interface Product {
  id: string;
  name: string;
  summary: string;
  price: { amount: number; currency: string };
  compare_at_price: { amount: number; currency: string } | null;
  in_stock: boolean;
  stock_level: string;
  image_url: string | null;
  category: { id: string; name: string; slug: string };
  rating: null;
  ships_internationally: boolean;
  url: string;
}

/** Full product detail */
export interface ProductDetail extends Product {
  description: string;
  description_format: string;
  variants: ProductVariant[];
  images: string[];
  attributes: {
    type: string;
    subtype: string;
    weight: string;
    vendor: string;
  };
  shipping: {
    ships_from: string;
    ships_internationally: boolean;
    restricted_countries: string[];
  };
}

/** Product variant */
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: { amount: number; currency: string };
  in_stock: boolean;
  stock_level: string;
  attributes: Record<string, string>;
}

/** Search response */
export interface SearchResponse {
  results: Product[];
  next_cursor: string | null;
  applied_filters: {
    q: string;
    limit: number;
    in_stock_only: boolean;
  };
}

/** City from delivery cities */
export interface DeliveryCity {
  name: string;
  aliases: string[];
}

/** Delivery check response */
export interface DeliveryCheck {
  city: string;
  now: string;
  checked_date: string;
  available: boolean;
  rate: number;
  currency: string;
  reason?: string | null;
  next_available_date?: string | null;
  perishable_warning: string | null;
}

/** Order creation response */
export interface OrderResponse {
  checkout_url: string;
  order_ref: string;
  summary: {
    items_total: number;
    delivery_fee: number;
    addons_total: number;
    grand_total: number;
    currency: string;
  };
  expires_at: string;
}

/** Order tracking response */
export interface OrderTracking {
  order_number: string;
  pnref: string;
  status: string;
  status_display: string;
  order_date: string;
  delivery_date: string;
  shipped_date: string | null;
  amount: string;
  payment_method: string;
  comments: string | null;
  recipient: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  greeting_message: string | null;
  special_instructions: string | null;
  progress: { step: string; timestamp: string }[];
  live_tracking_available: boolean;
  has_delivery_video: boolean;
  has_delivery_photo: boolean;
  items: {
    product_id: string;
    name: string;
    quantity: number;
    selling_price: number;
  }[];
}

/** Category */
export interface Category {
  name: string;
  url: string;
  children?: Category[];
}
