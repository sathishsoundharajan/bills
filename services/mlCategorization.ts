// ML-based item categorization service
export class MLCategorizationService {
  private static instance: MLCategorizationService;
  
  // Pre-trained categories with keywords
  private categories = {
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream'],
    'Meat & Seafood': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'ham', 'bacon'],
    'Produce': ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'potato', 'carrot'],
    'Bakery': ['bread', 'bagel', 'muffin', 'cake', 'cookie', 'donut', 'croissant'],
    'Pantry': ['rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'sauce', 'spice'],
    'Frozen': ['frozen', 'ice cream', 'pizza', 'vegetables', 'fruit'],
    'Beverages': ['soda', 'juice', 'water', 'coffee', 'tea', 'beer', 'wine'],
    'Snacks': ['chips', 'crackers', 'nuts', 'candy', 'chocolate', 'popcorn'],
    'Health & Beauty': ['shampoo', 'soap', 'toothpaste', 'deodorant', 'lotion'],
    'Household': ['detergent', 'paper towel', 'toilet paper', 'cleaner', 'trash bag'],
    'Baby': ['diaper', 'formula', 'baby food', 'wipes'],
    'Pet': ['dog food', 'cat food', 'pet treat', 'litter']
  };

  static getInstance(): MLCategorizationService {
    if (!MLCategorizationService.instance) {
      MLCategorizationService.instance = new MLCategorizationService();
    }
    return MLCategorizationService.instance;
  }

  categorizeItem(itemName: string): string {
    const normalizedName = itemName.toLowerCase();
    
    // Find the best matching category
    for (const [category, keywords] of Object.entries(this.categories)) {
      for (const keyword of keywords) {
        if (normalizedName.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Default category if no match found
    return 'Other';
  }

  // Enhanced categorization with confidence scoring
  categorizeItemWithConfidence(itemName: string): { category: string; confidence: number } {
    const normalizedName = itemName.toLowerCase();
    let bestMatch = { category: 'Other', confidence: 0 };
    
    for (const [category, keywords] of Object.entries(this.categories)) {
      for (const keyword of keywords) {
        if (normalizedName.includes(keyword)) {
          // Calculate confidence based on keyword match length
          const confidence = keyword.length / normalizedName.length;
          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence };
          }
        }
      }
    }
    
    return bestMatch;
  }

  // Learn from user corrections to improve categorization
  learnFromCorrection(itemName: string, correctCategory: string): void {
    // In a production app, this would update the ML model
    // For now, we'll add the item to the category keywords
    const normalizedName = itemName.toLowerCase();
    const words = normalizedName.split(' ');
    
    if (this.categories[correctCategory]) {
      // Add unique words to the category
      words.forEach(word => {
        if (word.length > 2 && !this.categories[correctCategory].includes(word)) {
          this.categories[correctCategory].push(word);
        }
      });
    }
  }
}