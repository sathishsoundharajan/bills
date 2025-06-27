import { Receipt, DashboardStats, ItemTrend, Store } from '@/types';

// Mock data for demonstration
export const mockReceipts: Receipt[] = [
  {
    id: '1',
    userId: 'user1',
    storeName: 'Walmart',
    storeLocation: 'Downtown',
    date: new Date('2024-01-15'),
    total: 45.67,
    items: [
      {
        id: '1',
        name: 'Milk',
        category: 'Dairy',
        quantity: 1,
        unitPrice: 3.99,
        totalPrice: 3.99
      },
      {
        id: '2',
        name: 'Bread',
        category: 'Bakery',
        quantity: 2,
        unitPrice: 2.49,
        totalPrice: 4.98
      },
      {
        id: '3',
        name: 'Apples',
        category: 'Produce',
        quantity: 5,
        unitPrice: 1.29,
        totalPrice: 6.45
      }
    ],
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    userId: 'user1',
    storeName: 'Target',
    storeLocation: 'Mall Plaza',
    date: new Date('2024-01-10'),
    total: 78.32,
    items: [
      {
        id: '4',
        name: 'Milk',
        category: 'Dairy',
        quantity: 1,
        unitPrice: 4.29,
        totalPrice: 4.29
      },
      {
        id: '5',
        name: 'Chicken Breast',
        category: 'Meat',
        quantity: 2,
        unitPrice: 12.99,
        totalPrice: 25.98
      }
    ],
    createdAt: new Date('2024-01-10')
  }
];

export const mockDashboardStats: DashboardStats = {
  totalSpent: 1245.67,
  totalReceipts: 24,
  totalItems: 156,
  favoriteStore: 'Walmart',
  monthlySpending: [
    { month: 'Jan', amount: 345.67 },
    { month: 'Feb', amount: 289.34 },
    { month: 'Mar', amount: 412.89 },
    { month: 'Apr', amount: 197.77 }
  ],
  topItems: [
    { name: 'Milk', count: 8, totalSpent: 32.45 },
    { name: 'Bread', count: 6, totalSpent: 18.94 },
    { name: 'Eggs', count: 5, totalSpent: 24.95 }
  ],
  topCategories: [
    { category: 'Groceries', amount: 567.89, percentage: 45.6 },
    { category: 'Household', amount: 234.56, percentage: 18.8 },
    { category: 'Personal Care', amount: 189.34, percentage: 15.2 }
  ]
};

export const mockItemTrends: ItemTrend[] = [
  {
    itemName: 'Milk',
    averagePrice: 4.14,
    lowestPrice: 3.99,
    highestPrice: 4.49,
    prices: [
      { date: new Date('2024-01-01'), price: 3.99, storeName: 'Walmart', storeId: '1' },
      { date: new Date('2024-01-10'), price: 4.29, storeName: 'Target', storeId: '2' },
      { date: new Date('2024-01-20'), price: 4.49, storeName: 'Safeway', storeId: '3' }
    ]
  }
];

export const mockStores: Store[] = [
  { id: '1', name: 'Walmart', location: 'Downtown', address: '123 Main St' },
  { id: '2', name: 'Target', location: 'Mall Plaza', address: '456 Mall Rd' },
  { id: '3', name: 'Safeway', location: 'North Side', address: '789 North Ave' }
];