import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { FirebaseService } from '../services/firebaseService';

export default function UploadScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to select images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please select or take a photo first.');
      return;
    }

    setUploading(true);
    try {
      const result = await FirebaseService.uploadReceiptImage(selectedImage.uri);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Receipt uploaded successfully. It will be processed shortly.',
          [
            {
              text: 'OK',
              onPress: () => setSelectedImage(null)
            }
          ]
        );
      } else {
        Alert.alert('Upload Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Receipt</Text>
        <Text style={styles.subtitle}>
          Take a photo or select an image from your gallery
        </Text>

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.image} />
            <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={24} color="#ffffff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={pickImageFromGallery}
            disabled={uploading}
          >
            <Ionicons name="images" size={24} color="#ffffff" />
            <Text style={styles.buttonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        {selectedImage && (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              uploading && styles.uploadButtonDisabled
            ]}
            onPress={uploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#ffffff" />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Upload Receipt'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Tips for better results:</Text>
          <Text style={styles.instructionText}>
            • Ensure the receipt is well-lit and clearly visible
          </Text>
          <Text style={styles.instructionText}>
            • Keep the receipt flat and avoid shadows
          </Text>
          <Text style={styles.instructionText}>
            • Make sure all text is readable in the image
          </Text>
          <Text style={styles.instructionText}>
            • Crop out unnecessary background
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  cameraButton: {
    backgroundColor: '#2563eb',
  },
  galleryButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
});