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
  static async uploadReceiptImage(imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const filename = `receipts/receipt_${timestamp}.jpg`;
      const storageRef = ref(storage, filename);
      
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        downloadURL,
        filename: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all receipts
  static async getReceipts() {
    try {
      const receiptsRef = collection(db, 'receipts');
      const q = query(receiptsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const receipts = [];
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
        error: error.message
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
        error: error.message
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
      
      const receipts = [];
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
        error: error.message
      };
    }
  }
}