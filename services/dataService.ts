import { Receipt, User, DashboardStats } from '@/types';
import { Platform } from 'react-native';

// Data service for managing receipts and user data
export class DataService {
  private static instance: DataService;
  private receipts: Receipt[] = [];
  private currentUser: User | null = null;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // User Management
  async signIn(email: string, password: string): Promise<User> {
    // Mock authentication - in production, use Firebase Auth
    const user: User = {
      id: 'user_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      photoURL: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`
    };
    
    this.currentUser = user;
    await this.loadUserData(user.id);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    // Mock registration
    const user: User = {
      id: 'user_' + Date.now(),
      email,
      displayName,
      photoURL: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`
    };
    
    this.currentUser = user;
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.receipts = [];
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Receipt Management
  async saveReceipt(receipt: Receipt): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      const existingIndex = this.receipts.findIndex(r => r.id === receipt.id);
      if (existingIndex >= 0) {
        this.receipts[existingIndex] = receipt;
      } else {
        this.receipts.push(receipt);
      }
      
      localStorage.setItem('receipts', JSON.stringify(this.receipts));
    } else {
      // In production, use AsyncStorage for mobile
      this.receipts.push(receipt);
    }
  }

  async getReceipts(): Promise<Receipt[]> {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem('receipts');
      if (stored) {
        this.receipts = JSON.parse(stored).map((r: any) => ({
          ...r,
          date: new Date(r.date),
          createdAt: new Date(r.createdAt)
        }));
      }
    }
    
    return this.receipts;
  }

  async deleteReceipt(receiptId: string): Promise<void> {
    this.receipts = this.receipts.filter(r => r.id !== receiptId);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('receipts', JSON.stringify(this.receipts));
    }
  }

  // Manual Spending Entry
  async addManualSpending(data: {
    storeName: string;
    storeLocation: string;
    date: Date;
    amount: number;
    category: string;
    description: string;
  }): Promise<Receipt> {
    const receipt: Receipt = {
      id: 'manual_' + Date.now(),
      userId: this.currentUser?.id || 'anonymous',
      storeName: data.storeName,
      storeLocation: data.storeLocation,
      date: data.date,
      total: data.amount,
      items: [{
        id: 'item_' + Date.now(),
        name: data.description,
        category: data.category,
        quantity: 1,
        unitPrice: data.amount,
        totalPrice: data.amount
      }],
      createdAt: new Date(),
      isManualEntry: true
    };

    await this.saveReceipt(receipt);
    return receipt;
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const receipts = await this.getReceipts();
    
    const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
    const totalReceipts = receipts.length;
    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
    
    // Find favorite store
    const storeFrequency: { [key: string]: number } = {};
    receipts.forEach(r => {
      storeFrequency[r.storeName] = (storeFrequency[r.storeName] || 0) + 1;
    });
    const favoriteStore = Object.keys(storeFrequency).reduce((a, b) => 
      storeFrequency[a] > storeFrequency[b] ? a : b, 'N/A');

    // Monthly spending
    const monthlySpending = this.calculateMonthlySpending(receipts);
    
    // Top items
    const topItems = this.calculateTopItems(receipts);
    
    // Top categories
    const topCategories = this.calculateTopCategories(receipts);

    return {
      totalSpent,
      totalReceipts,
      totalItems,
      favoriteStore,
      monthlySpending,
      topItems,
      topCategories
    };
  }

  private calculateMonthlySpending(receipts: Receipt[]) {
    const monthlyData: { [key: string]: number } = {};
    
    receipts.forEach(receipt => {
      const monthKey = receipt.date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + receipt.total;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  }

  private calculateTopItems(receipts: Receipt[]) {
    const itemData: { [key: string]: { count: number; totalSpent: number } } = {};
    
    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        if (!itemData[item.name]) {
          itemData[item.name] = { count: 0, totalSpent: 0 };
        }
        itemData[item.name].count += item.quantity;
        itemData[item.name].totalSpent += item.totalPrice;
      });
    });

    return Object.entries(itemData)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));
  }

  private calculateTopCategories(receipts: Receipt[]) {
    const categoryData: { [key: string]: number } = {};
    const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
    
    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        categoryData[item.category] = (categoryData[item.category] || 0) + item.totalPrice;
      });
    });

    return Object.entries(categoryData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100
      }));
  }

  private async loadUserData(userId: string): Promise<void> {
    // In production, load user's receipts from Firebase
    await this.getReceipts();
  }
}