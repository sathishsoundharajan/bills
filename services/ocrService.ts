import { Platform } from 'react-native';

// OCR Service for text extraction from receipt images
export class OCRService {
  private static instance: OCRService;

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        return await this.extractTextWeb(imageUri);
      } else {
        // For mobile, we'll use a mock implementation
        // In production, you'd integrate with Google Vision API or similar
        return await this.extractTextMobile(imageUri);
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  private async extractTextWeb(imageUri: string): Promise<string> {
    // Using Tesseract.js for web OCR
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(imageUri);
    await worker.terminate();
    
    return text;
  }

  private async extractTextMobile(imageUri: string): Promise<string> {
    // Mock implementation for mobile
    // In production, integrate with Google Vision API or similar service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`WALMART SUPERCENTER
Store #1234
123 Main St, City, ST 12345

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

GROCERY
Milk 1 Gallon         $3.99
Bread Whole Wheat     $2.49
Eggs Large 12ct       $3.29
Bananas 3lbs          $2.97
Chicken Breast 2lbs   $8.99
Rice 5lb bag          $4.99
Apples 3lbs           $4.47

SUBTOTAL             $31.19
TAX                   $2.18
TOTAL                $33.37

PAYMENT: VISA ****1234
CHANGE DUE           $0.00

Thank you for shopping!`);
      }, 2000);
    });
  }
}