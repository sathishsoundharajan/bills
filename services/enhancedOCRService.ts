import { Platform } from 'react-native';

// Enhanced OCR Service with better text extraction and preprocessing
export class EnhancedOCRService {
  private static instance: EnhancedOCRService;

  static getInstance(): EnhancedOCRService {
    if (!EnhancedOCRService.instance) {
      EnhancedOCRService.instance = new EnhancedOCRService();
    }
    return EnhancedOCRService.instance;
  }

  async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        return await this.extractTextWeb(imageUri);
      } else {
        // For mobile, use enhanced mock implementation
        return await this.extractTextMobile(imageUri);
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  private async extractTextWeb(imageUri: string): Promise<string> {
    // Enhanced Tesseract.js implementation with preprocessing
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m)
    });

    // Configure Tesseract for better receipt recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/%-: ',
      tessedit_pageseg_mode: '6', // Uniform block of text
      preserve_interword_spaces: '1'
    });

    // Preprocess image for better OCR results
    const preprocessedImage = await this.preprocessImage(imageUri);
    
    const { data: { text } } = await worker.recognize(preprocessedImage);
    await worker.terminate();
    
    return this.postProcessText(text);
  }

  private async preprocessImage(imageUri: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx?.drawImage(img, 0, 0);
        
        if (ctx) {
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply contrast and brightness adjustments
          for (let i = 0; i < data.length; i += 4) {
            // Increase contrast
            const contrast = 1.5;
            const brightness = 20;
            
            data[i] = Math.min(255, Math.max(0, contrast * (data[i] - 128) + 128 + brightness));     // Red
            data[i + 1] = Math.min(255, Math.max(0, contrast * (data[i + 1] - 128) + 128 + brightness)); // Green
            data[i + 2] = Math.min(255, Math.max(0, contrast * (data[i + 2] - 128) + 128 + brightness)); // Blue
          }
          
          // Put processed image data back
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL());
      };
      
      img.src = imageUri;
    });
  }

  private postProcessText(text: string): string {
    // Clean up OCR text
    let cleanedText = text
      .replace(/[^\w\s.,$/%-:]/g, '') // Remove special characters except common receipt ones
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Fix common OCR errors
    const corrections = {
      '0': ['O', 'o'],
      '1': ['l', 'I', '|'],
      '5': ['S', 's'],
      '8': ['B'],
      '$': ['S', 's'],
      '.': [','],
    };

    for (const [correct, errors] of Object.entries(corrections)) {
      errors.forEach(error => {
        cleanedText = cleanedText.replace(new RegExp(error, 'g'), correct);
      });
    }

    return cleanedText;
  }

  private async extractTextMobile(imageUri: string): Promise<string> {
    // Enhanced mock implementation with realistic receipt data
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockReceipts = [
          `WALMART SUPERCENTER
Store #1234 Manager: JOHN DOE
123 MAIN ST, ANYTOWN, ST 12345
(555) 123-4567

${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
ASSOCIATE: JANE SMITH

GROCERY
MILK WHOLE GALLON         $3.99
BREAD WHEAT LOAF          $2.49
EGGS LARGE 12CT           $3.29
BANANAS ORGANIC 2LBS      $2.97
CHICKEN BREAST 2LBS       $8.99
RICE JASMINE 5LB          $4.99
APPLES GALA 3LBS          $4.47
YOGURT GREEK 32OZ         $5.99
CHEESE CHEDDAR 8OZ        $3.99
PASTA PENNE 1LB           $1.99

SUBTOTAL                 $43.16
TAX 8.25%                 $3.56
TOTAL                    $46.72

VISA ENDING IN 1234      $46.72
CHANGE DUE               $0.00

ITEMS SOLD: 10
TC# 1234 5678 9012 3456 7890

Thank you for shopping with us!
Visit walmart.com for great deals`,

          `TARGET
Store T-0123
456 SHOPPING BLVD
CITYVILLE, ST 54321

${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

GROCERY & ESSENTIALS
MILK 2% GALLON            $4.29
BREAD WHOLE GRAIN         $2.99
EGGS ORGANIC 12CT         $4.99
GROUND BEEF 1LB           $6.99
SALMON FILLET 1LB        $12.99
BROCCOLI CROWNS 1LB       $2.99
STRAWBERRIES 1LB          $3.99
OLIVE OIL 500ML           $7.99
PASTA SAUCE 24OZ          $2.49
CEREAL CHEERIOS           $4.99

HOUSEHOLD
PAPER TOWELS 6PK          $8.99
DISH SOAP 24OZ            $3.49
LAUNDRY DETERGENT         $9.99

SUBTOTAL                 $73.16
TAX                       $5.85
TOTAL                    $79.01

MASTERCARD ****5678      $79.01

REDcard saves 5% every day
Visit target.com/redcard`,

          `WHOLE FOODS MARKET
Store #12345
789 ORGANIC WAY
HEALTHTOWN, ST 98765

${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

PRODUCE
ORGANIC SPINACH 5OZ       $3.99
AVOCADOS HASS 4CT         $5.99
ORGANIC CARROTS 2LB       $2.99
BELL PEPPERS 3CT          $4.99
ORGANIC TOMATOES 1LB      $4.99

MEAT & SEAFOOD
ORGANIC CHICKEN 2LB      $14.99
WILD SALMON 1LB          $18.99
GRASS-FED BEEF 1LB       $12.99

DAIRY
ORGANIC MILK 64OZ         $5.99
ORGANIC EGGS 12CT         $6.99
ORGANIC BUTTER 1LB        $7.99

PANTRY
QUINOA ORGANIC 1LB        $6.99
OLIVE OIL EXTRA VIRGIN   $12.99
ALMOND BUTTER 16OZ        $9.99

SUBTOTAL                $118.85
TAX                       $9.51
TOTAL                   $128.36

AMEX ****9012           $128.36

Thank you for choosing quality!`
        ];

        const randomReceipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
        resolve(randomReceipt);
      }, 2000);
    });
  }

  // Extract specific data patterns from receipt text
  extractReceiptData(text: string): {
    storeName: string;
    storeLocation: string;
    date: Date;
    items: Array<{ name: string; price: number; quantity?: number }>;
    subtotal: number;
    tax: number;
    total: number;
  } {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      storeName: this.extractStoreName(lines),
      storeLocation: this.extractStoreLocation(lines),
      date: this.extractDate(lines),
      items: this.extractItems(lines),
      subtotal: this.extractAmount(lines, 'subtotal'),
      tax: this.extractAmount(lines, 'tax'),
      total: this.extractAmount(lines, 'total')
    };
  }

  private extractStoreName(lines: string[]): string {
    const storePatterns = [
      /^(walmart|target|safeway|kroger|costco|whole foods|trader joe|publix|stop & shop)/i,
      /^([A-Z\s&]+)\s+(SUPERCENTER|STORE|MARKET|GROCERY)/i
    ];
    
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      for (const pattern of storePatterns) {
        const match = lines[i].match(pattern);
        if (match) {
          return match[1] || match[0];
        }
      }
    }
    
    return lines[0] || 'Unknown Store';
  }

  private extractStoreLocation(lines: string[]): string {
    const addressPattern = /\d+.*(?:st|street|ave|avenue|rd|road|blvd|boulevard|way|dr|drive)/i;
    
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

  private extractItems(lines: string[]): Array<{ name: string; price: number; quantity?: number }> {
    const items: Array<{ name: string; price: number; quantity?: number }> = [];
    const itemPattern = /^(.+?)\s+\$(\d+\.?\d*)$/;
    const quantityPattern = /^(.+?)\s+(\d+)\s*x?\s*\$(\d+\.?\d*)$/;
    
    for (const line of lines) {
      // Skip total lines
      if (this.isTotal(line)) continue;
      
      // Try quantity pattern first
      const quantityMatch = line.match(quantityPattern);
      if (quantityMatch) {
        const name = quantityMatch[1].trim();
        const quantity = parseInt(quantityMatch[2]);
        const price = parseFloat(quantityMatch[3]);
        
        if (price > 0 && name.length > 1) {
          items.push({ name, price, quantity });
          continue;
        }
      }
      
      // Try regular item pattern
      const itemMatch = line.match(itemPattern);
      if (itemMatch) {
        const name = itemMatch[1].trim();
        const price = parseFloat(itemMatch[2]);
        
        if (price > 0 && name.length > 1) {
          items.push({ name, price });
        }
      }
    }
    
    return items;
  }

  private extractAmount(lines: string[], type: string): number {
    const pattern = new RegExp(`${type}.*\\$(\\d+\\.?\\d*)`, 'i');
    
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return 0;
  }

  private isTotal(line: string): boolean {
    const totalKeywords = ['subtotal', 'tax', 'total', 'change', 'payment', 'visa', 'mastercard', 'amex', 'cash'];
    return totalKeywords.some(keyword => line.toLowerCase().includes(keyword));
  }
}