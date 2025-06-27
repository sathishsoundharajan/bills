export interface Receipt {
  id: string;
  userId: string;
  storeName: string;
  storeLocation: string;
  date: Date;
  total: number;
  imageUrl?: string;
  items: ReceiptItem[];
  createdAt: Date;
  isManualEntry?: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  address?: string;
}

export interface ItemTrend {
  itemName: string;
  prices: PricePoint[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
}

export interface PricePoint {
  date: Date;
  price: number;
  storeName: string;
  storeId: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface DashboardStats {
  totalSpent: number;
  totalReceipts: number;
  totalItems: number;
  favoriteStore: string;
  monthlySpending: MonthlySpending[];
  topItems: TopItem[];
  topCategories: CategorySpending[];
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface TopItem {
  name: string;
  count: number;
  totalSpent: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export interface ManualSpendingEntry {
  storeName: string;
  storeLocation: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
}

export interface MLCategorizationResult {
  category: string;
  confidence: number;
  alternatives: string[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}