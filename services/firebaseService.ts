import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../config/firebase';

export class FirebaseService {
  // Upload image to Firebase Storage
  static async uploadReceiptImage(imageUri: string) {
    try {
      console.log('Starting upload for:', imageUri);
      
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob created, size:', blob.size);
      
      const timestamp = Date.now();
      const filename = `receipts/receipt_${timestamp}.jpg`;
      const storageRef = ref(storage, filename);
      
      console.log('Uploading to:', filename);
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('Upload successful:', snapshot.ref.fullPath);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return {
        success: true,
        downloadURL,
        filename: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  // Get all receipts
  static async getReceipts() {
    try {
      const receiptsRef = collection(db, 'receipts');
      const q = query(receiptsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const receipts: any[] = [];
      querySnapshot.forEach((doc) => {
        receipts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: receipts
      };
    } catch (error) {
      console.error('Error fetching receipts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get analytics data via Cloud Function
  static async getAnalytics() {
    try {
      const getReceiptAnalytics = httpsCallable(functions, 'getReceiptAnalytics');
      const result = await getReceiptAnalytics();
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get recent receipts for dashboard
  static async getRecentReceipts(limitCount = 10) {
    try {
      const receiptsRef = collection(db, 'receipts');
      const q = query(
        receiptsRef, 
        orderBy('created_at', 'desc'), 
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      const receipts: any[] = [];
      querySnapshot.forEach((doc) => {
        receipts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        data: receipts
      };
    } catch (error) {
      console.error('Error fetching recent receipts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}