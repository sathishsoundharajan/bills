import { ReceiptItem } from '@/types';
import { MLCategorizationService } from './mlCategorization';

export interface ParsedReceipt {
  storeName: string;
  storeLocation: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export class ReceiptParser {
  private mlService = MLCategorizationService.getInstance();

  parseReceiptText(text: string): ParsedReceipt {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract store information
    const storeName = this.extractStoreName(lines);
    const storeLocation = this.extractStoreLocation(lines);
    const date = this.extractDate(lines);
    
    // Extract items
    const items = this.extractItems(lines);
    
    // Extract totals
    const { subtotal, tax, total } = this.extractTotals(lines);
    
    return {
      storeName,
      storeLocation,
      date,
      items,
      subtotal,
      tax,
      total
    };
  }

  private extractStoreName(lines: string[]): string {
    // Look for common store patterns in first few lines
    const storePatterns = [
      /walmart/i,
      /target/i,
      /safeway/i,
      /kroger/i,
      /costco/i,
      /whole foods/i,
      /trader joe/i
    ];
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      for (const pattern of storePatterns) {
        if (pattern.test(lines[i])) {
          return lines[i];
        }
      }
    }
    
    return lines[0] || 'Unknown Store';
  }

  private extractStoreLocation(lines: string[]): string {
    // Look for address patterns
    const addressPattern = /\d+.*(?:st|street|ave|avenue|rd|road|blvd|boulevard)/i;
    
    for (const line of lines.slice(0, 10)) {
      if (addressPattern.test(line)) {
        return line;
      }
    }
    
    return 'Unknown Location';
  }

  private extractDate(lines: string[]): Date {
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{1,2}-\d{1,2}-\d{2,4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/
    ];
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          return new Date(match[1]);
        }
      }
    }
    
    return new Date();
  }

  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const itemPattern = /^(.+?)\s+\$?(\d+\.?\d*)$/;
    
    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match && !this.isTotal(line)) {
        const name = match[1].trim();
        const price = parseFloat(match[2]);
        
        if (price > 0 && name.length > 1) {
          const category = this.mlService.categorizeItem(name);
          
          items.push({
            id: this.generateId(),
            name,
            category,
            quantity: 1,
            unitPrice: price,
            totalPrice: price
          });
        }
      }
    }
    
    return items;
  }

  private extractTotals(lines: string[]): { subtotal: number; tax: number; total: number } {
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    
    const subtotalPattern = /subtotal.*\$?(\d+\.?\d*)/i;
    const taxPattern = /tax.*\$?(\d+\.?\d*)/i;
    const totalPattern = /total.*\$?(\d+\.?\d*)/i;
    
    for (const line of lines) {
      const subtotalMatch = line.match(subtotalPattern);
      const taxMatch = line.match(taxPattern);
      const totalMatch = line.match(totalPattern);
      
      if (subtotalMatch) subtotal = parseFloat(subtotalMatch[1]);
      if (taxMatch) tax = parseFloat(taxMatch[1]);
      if (totalMatch) total = parseFloat(totalMatch[1]);
    }
    
    return { subtotal, tax, total };
  }

  private isTotal(line: string): boolean {
    const totalKeywords = ['subtotal', 'tax', 'total', 'change', 'payment'];
    return totalKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}