export type UserRole = "SUPPLIER" | "STORE_MANAGER";
export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyName: string;
  contactName: string;
  phone: string;
  name?: string;
  username?: string;
}

export type Supplier = User;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  minBatchSize: number; // Wholesale min batch size
  moq?: number;
  unit?: string;
  stock: number;
  supplierId: string;
  supplierName: string;
  category: string;
  imageUrl?: string;
  image?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  productName?: string;
  price: number;
  quantity: number;
  unit?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "PAID" | "PROCESSING" | "REGISTERED" | "WAITING_SHIPPING_COST" | "PENDING_POSTAL_LABEL" | "COMPLETED" | "REJECTED" | "CANCELLED" | "OUT_OF_STOCK" | string;
export type SettlementStatus = "UNSETTLED" | "SETTLED" | string;

export interface Order {
  id: string;
  storeManagerId: string;
  storeManagerName: string;
  storeManagerCompany: string;
  storeName?: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: string;
  settlementStatus: SettlementStatus;
  createdAt: string;
}

export interface Settlement {
  id: string;
  orderId: string;
  amount: number;
  supplierId: string;
  storeManagerId: string;
  storeManagerCompany: string;
  createdAt: string;
  netPayout?: number;
  commission?: number;
  status?: string;
  date?: string;
}

declare global {
  interface Window {
    customConfirm?: (msg: string) => Promise<boolean>;
    customPrompt?: (msg: string, defaultValue?: string) => Promise<string | null>;
    customAlert?: (msg: string) => Promise<void>;
  }
}

