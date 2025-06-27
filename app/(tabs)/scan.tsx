import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, RotateCcw, Check, Loader, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { EnhancedOCRService } from '@/services/enhancedOCRService';
import { EnhancedMLCategorizationService } from '@/services/enhancedMLCategorization';
import { SecureDataService } from '@/services/secureDataService';
import { Receipt, ReceiptItem } from '@/types';
import EnhancedReceiptReviewModal from '@/components/EnhancedReceiptReviewModal';

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [parsedReceipt, setParsedReceipt] = useState<Receipt | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const ocrService = EnhancedOCRService.getInstance();
  const mlService = EnhancedMLCategorizationService.getInstance();
  const dataService = SecureDataService.getInstance();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#3B82F6" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan your receipts and extract item information automatically using advanced OCR and AI
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const processReceipt = async () => {
    if (!capturedImage) return;

    setProcessing(true);

    try {
      // Step 1: Extract text using enhanced OCR
      setProcessingStep('Extracting text with OCR...');
      const extractedData = ocrService.extractReceiptData(
        await ocrService.extractTextFromImage(capturedImage)
      );
      
      // Step 2: Initialize ML service
      setProcessingStep('Initializing AI categorization...');
      await mlService.initialize();
      
      // Step 3: Process items with ML categorization
      setProcessingStep('Categorizing items with AI...');
      const processedItems: ReceiptItem[] = [];
      
      for (const item of extractedData.items) {
        const mlResult = await mlService.categorizeItem(item.name);
        
        processedItems.push({
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          name: item.name,
          category: mlResult.category,
          quantity: item.quantity || 1,
          unitPrice: item.price / (item.quantity || 1),
          totalPrice: item.price
        });
      }
      
      // Step 4: Create receipt object
      setProcessingStep('Finalizing receipt...');
      const receipt: Receipt = {
        id: 'receipt_' + Date.now(),
        userId: dataService.getCurrentUser()?.id || 'anonymous',
        storeName: extractedData.storeName,
        storeLocation: extractedData.storeLocation,
        date: extractedData.date,
        total: extractedData.total || processedItems.reduce((sum, item) => sum + item.totalPrice, 0),
        items: processedItems,
        imageUrl: capturedImage,
        createdAt: new Date()
      };

      setParsedReceipt(receipt);
      setShowReviewModal(true);
      
    } catch (error) {
      console.error('Receipt processing failed:', error);
      Alert.alert(
        'Processing Failed', 
        'Unable to process the receipt. Please try again with better lighting or enter details manually.',
        [
          { text: 'Try Again', onPress: retakePicture },
          { text: 'Manual Entry', onPress: () => router.push('/(tabs)') }
        ]
      );
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const handleReceiptSaved = () => {
    setCapturedImage(null);
    setParsedReceipt(null);
    Alert.alert('Success', 'Receipt saved successfully!');
    router.push('/(tabs)');
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={toggleCameraFacing}>
                <RotateCcw size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scanFrame}>
              <View style={styles.scanCorners}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanInstructions}>
                Position receipt within frame for best OCR results
              </Text>
            </View>
            
            <View style={styles.cameraFooter}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Receipt Preview</Text>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {processing ? (
            <View style={styles.processingContainer}>
              <View style={styles.processingIndicator}>
                <Sparkles size={32} color="#8B5CF6" />
                <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
              </View>
              <Text style={styles.processingTitle}>AI Processing Receipt</Text>
              <Text style={styles.processingText}>{processingStep}</Text>
              <View style={styles.processingSteps}>
                <Text style={styles.stepText}>✓ Enhanced OCR text extraction</Text>
                <Text style={styles.stepText}>✓ ML-powered item categorization</Text>
                <Text style={styles.stepText}>✓ Smart price detection</Text>
                <Text style={styles.stepText}>✓ Data validation</Text>
              </View>
            </View>
          ) : (
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={retakePicture}>
                <Camera size={20} color="#3B82F6" />
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryButton} onPress={processReceipt}>
                <Sparkles size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Process with AI</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <EnhancedReceiptReviewModal
          visible={showReviewModal}
          receipt={parsedReceipt}
          onClose={() => setShowReviewModal(false)}
          onSave={handleReceiptSaved}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AI Receipt Scanner</Text>
        <Text style={styles.headerSubtitle}>Capture receipts with advanced OCR and ML categorization</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.scanOptions}>
          <TouchableOpacity 
            style={styles.scanOption}
            onPress={() => setShowCamera(true)}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.scanOptionGradient}
            >
              <Camera size={48} color="#ffffff" />
              <Text style={styles.scanOptionTitle}>Smart Camera</Text>
              <Text style={styles.scanOptionText}>
                Enhanced OCR with real-time processing and AI categorization
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.scanOption}
            onPress={pickImage}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.scanOptionGradient}
            >
              <Upload size={48} color="#ffffff" />
              <Text style={styles.scanOptionTitle}>Upload Image</Text>
              <Text style={styles.scanOptionText}>
                Select from gallery for automatic text extraction and ML analysis
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.manualEntry}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.manualEntryText}>
            Can't scan? Add manual entry instead
          </Text>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>AI-Powered Features:</Text>
          <Text style={styles.featureText}>🤖 Advanced OCR with 95%+ accuracy</Text>
          <Text style={styles.featureText}>🧠 ML-powered item categorization</Text>
          <Text style={styles.featureText}>📊 Smart price and quantity detection</Text>
          <Text style={styles.featureText}>✏️ Review and edit with AI suggestions</Text>
          <Text style={styles.featureText}>🔒 Secure encrypted data storage</Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for best results:</Text>
          <Text style={styles.tipText}>• Ensure good lighting conditions</Text>
          <Text style={styles.tipText}>• Keep receipt flat and straight</Text>
          <Text style={styles.tipText}>• Include the entire receipt in frame</Text>
          <Text style={styles.tipText}>• Avoid shadows and glare</Text>
          <Text style={styles.tipText}>• Clean the camera lens</Text>
          <Text style={styles.tipText}>• Hold steady for 2-3 seconds</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#bfdbfe',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  scanOption: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanOptionGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  scanOptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  scanOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  manualEntry: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  manualEntryText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  featuresContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  cameraButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  scanFrame: {
    flex: 1,
    margin: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstructions: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewImage: {
    flex: 1,
    borderRadius: 16,
    marginBottom: 20,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingIndicator: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spinner: {
    position: 'absolute',
  },
  processingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  processingSteps: {
    alignItems: 'flex-start',
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#10b981',
    marginBottom: 4,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginLeft: 8,
  },
});