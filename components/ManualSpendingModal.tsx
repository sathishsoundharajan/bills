import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { X, Calendar, DollarSign, MapPin, Tag, FileText } from 'lucide-react-native';
import { DataService } from '@/services/dataService';
import { ManualSpendingEntry } from '@/types';

interface ManualSpendingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ManualSpendingModal({ visible, onClose, onSave }: ManualSpendingModalProps) {
  const [formData, setFormData] = useState<ManualSpendingEntry>({
    storeName: '',
    storeLocation: '',
    date: new Date(),
    amount: 0,
    category: 'Other',
    description: ''
  });

  const categories = [
    'Groceries', 'Dining', 'Gas', 'Shopping', 'Entertainment',
    'Healthcare', 'Transportation', 'Utilities', 'Other'
  ];

  const dataService = DataService.getInstance();

  const handleSave = async () => {
    if (!formData.storeName || !formData.description || formData.amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await dataService.addManualSpending(formData);
      
      // Reset form
      setFormData({
        storeName: '',
        storeLocation: '',
        date: new Date(),
        amount: 0,
        category: 'Other',
        description: ''
      });
      
      onSave();
      onClose();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Manual entry saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save manual entry');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Manual Entry</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Store Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Store Name *</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={formData.storeName}
              onChangeText={(text) => setFormData({ ...formData, storeName: text })}
              placeholder="Enter store name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Store Location */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Location</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={formData.storeLocation}
              onChangeText={(text) => setFormData({ ...formData, storeLocation: text })}
              placeholder="Enter store location"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <DollarSign size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Amount *</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={formData.amount > 0 ? formData.amount.toString() : ''}
              onChangeText={(text) => {
                const amount = parseFloat(text) || 0;
                setFormData({ ...formData, amount });
              }}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Tag size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.categoryChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, category })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category === category && styles.categoryChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <FileText size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Description *</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="What did you buy?"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Calendar size={20} color="#3B82F6" />
              <Text style={styles.labelText}>Date</Text>
            </View>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateText}>
                {formData.date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});