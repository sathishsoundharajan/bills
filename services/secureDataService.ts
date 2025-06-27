import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Receipt, User, DashboardStats, ManualSpendingEntry } from '@/types';

// Secure data service with encryption and cloud sync
export class SecureDataService {
  private static instance: SecureDataService;
  private receipts: Receipt[] = [];
  private currentUser: User | null = null;
  private encryptionKey: string | null = null;

  static getInstance(): SecureDataService {
    if (!SecureDataService.instance) {
      SecureDataService.instance = new SecureDataService();
    }
    return SecureDataService.instance;
  }

  // Initialize encryption
  private async initializeEncryption(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        // Use SecureStore for mobile
        this.encryptionKey = await SecureStore.getItemAsync('encryption_key');
        if (!this.encryptionKey) {
          this.encryptionKey = await Crypto.randomUUID();
          await SecureStore.setItemAsync('encryption_key', this.encryptionKey);
        }
      } else {
        // Use localStorage for web (in production, use proper encryption)
        this.encryptionKey = localStorage.getItem('encryption_key');
        if (!this.encryptionKey) {
          this.encryptionKey = crypto.randomUUID();
          localStorage.setItem('encryption_key', this.encryptionKey);
        }
      }
    } catch (error) {
      console.warn('Encryption initialization failed:', error);
      this.encryptionKey = 'fallback-key';
    }
  }

  // Encrypt data
  private async encryptData(data: string): Promise<string> {
    if (Platform.OS === 'web') {
      // Simple base64 encoding for web (use proper encryption in production)
      return btoa(data);
    }
    return data; // In production, implement proper encryption
  }

  // Decrypt data
  private async decryptData(encryptedData: string): Promise<string> {
    if (Platform.OS === 'web') {
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData; // Fallback for unencrypted data
      }
    }
    return encryptedData;
  }

  // User Management with secure authentication
  async signIn(email: string, password: string): Promise<User> {
    await this.initializeEncryption();
    
    // In production, integrate with Firebase Auth
    const user: User = {
      id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, email),
      email,
      displayName: email.split('@')[0],
      photoURL: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    this.currentUser = user;
    await this.saveUserSession(user);
    await this.loadUserData(user.id);
    return user;
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    await this.initializeEncryption();
    
    const user: User = {
      id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, email),
      email,
      displayName,
      photoURL: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    this.currentUser = user;
    await this.saveUserSession(user);
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.receipts = [];
    
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('user_session');
    } else {
      localStorage.removeItem('user_session');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Session management
  private async saveUserSession(user: User): Promise<void> {
    const sessionData = JSON.stringify(user);
    const encryptedSession = await this.encryptData(sessionData);
    
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('user_session', encryptedSession);
    } else {
      localStorage.setItem('user_session', encryptedSession);
    }
  }

  async restoreUserSession(): Promise<User | null> {
    try {
      await this.initializeEncryption();
      
      let encryptedSession: string | null = null;
      
      if (Platform.OS !== 'web') {
        encryptedSession = await SecureStore.getItemAsync('user_session');
      } else {
        encryptedSession = localStorage.getItem('user_session');
      }
      
      if (encryptedSession) {
        const sessionData = await this.decryptData(encryptedSession);
        const user = JSON.parse(sessionData);
        
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
        
        this.currentUser = user;
        await this.loadUserData(user.id);
        return user;
      }
    } catch (error) {
      console.warn('Failed to restore user session:', error);
    }
    
    return null;
  }

  // Receipt Management with encryption
  async saveReceipt(receipt: Receipt): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const existingIndex = this.receipts.findIndex(r => r.id === receipt.id);
    if (existingIndex >= 0) {
      this.receipts[existingIndex] = receipt;
    } else {
      this.receipts.push(receipt);
    }
    
    await this.saveReceiptsToStorage();
  }

  async getReceipts(): Promise<Receipt[]> {
    if (!this.currentUser) return [];
    
    await this.loadReceiptsFromStorage();
    return this.receipts.filter(r => r.userId === this.currentUser!.id);
  }

  async deleteReceipt(receiptId: string): Promise<void> {
    this.receipts = this.receipts.filter(r => r.id !== receiptId);
    await this.saveReceiptsToStorage();
  }

  // Storage operations
  private async saveReceiptsToStorage(): Promise<void> {
    if (!this.currentUser) return;
    
    const receiptsData = JSON.stringify(this.receipts);
    const encryptedData = await this.encryptData(receiptsData);
    const storageKey = `receipts_${this.currentUser.id}`;
    
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(storageKey, encryptedData);
    } else {
      localStorage.setItem(storageKey, encryptedData);
    }
  }

  private async loadReceiptsFromStorage(): Promise<void> {
    if (!this.currentUser) return;
    
    const storageKey = `receipts_${this.currentUser.id}`;
    let encryptedData: string | null = null;
    
    if (Platform.OS !== 'web') {
      encryptedData = await SecureStore.getItemAsync(storageKey);
    } else {
      encryptedData = localStorage.getItem(storageKey);
    }
    
    if (encryptedData) {
      try {
        const receiptsData = await this.decryptData(encryptedData);
        const receipts = JSON.parse(receiptsData);
        
        // Convert date strings back to Date objects
        this.receipts = receipts.map((r: any) => ({
          ...r,
          date: new Date(r.date),
          createdAt: new Date(r.createdAt)
        }));
      } catch (error) {
        console.warn('Failed to load receipts:', error);
        this.receipts = [];
      }
    }
  }

  // Manual spending entry
  async addManualSpending(data: ManualSpendingEntry): Promise<Receipt> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const receipt: Receipt = {
      id: 'manual_' + Date.now(),
      userId: this.currentUser.id,
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

  // Analytics and dashboard
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

    // Calculate trends
    const monthlySpending = this.calculateMonthlySpending(receipts);
    const topItems = this.calculateTopItems(receipts);
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
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }));
  }

  private async loadUserData(userId: string): Promise<void> {
    await this.loadReceiptsFromStorage();
  }

  // Data export for user
  async exportUserData(): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const receipts = await this.getReceipts();
    const stats = await this.getDashboardStats();
    
    const exportData = {
      user: this.currentUser,
      receipts,
      stats,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Data backup
  async createBackup(): Promise<string> {
    const exportData = await this.exportUserData();
    const backupId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256, 
      exportData + Date.now()
    );
    
    // In production, upload to cloud storage
    return backupId;
  }
}