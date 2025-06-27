import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform
} from 'react-native';
import { X, Edit3, Trash2, Plus, Save } from 'lucide-react-native';
import { Receipt, ReceiptItem } from '@/types';
import { DataService } from '@/services/dataService';
import { MLCategorizationService } from '@/services/mlCategorization';

interface ReceiptReviewModalProps {
  visible: boolean;
  receipt: Receipt | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ReceiptReviewModal({ visible, receipt, onClose, onSave }: ReceiptReviewModalProps) {
  const [editedReceipt, setEditedReceipt] = useState<Receipt | null>(receipt);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const dataService = DataService.getInstance();
  const mlService = MLCategorizationService.getInstance();

  React.useEffect(() => {
    setEditedReceipt(receipt);
  }, [receipt]);

  if (!editedReceipt) return null;

  const handleSave = async () => {
    try {
      await dataService.saveReceipt(editedReceipt);
      onSave();
      onClose();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Receipt saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  const updateItem = (itemId: string, updates: Partial<ReceiptItem>) => {
    setEditedReceipt(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
      
      const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total: newTotal
      };
    });
  };

  const deleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEditedReceipt(prev => {
              if (!prev) return null;
              
              const updatedItems = prev.items.filter(item => item.id !== itemId);
              const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
              
              return {
                ...prev,
                items: updatedItems,
                total: newTotal
              };
            });
          }
        }
      ]
    );
  };

  const addNewItem = () => {
    const newItem: ReceiptItem = {
      id: 'item_' + Date.now(),
      name: 'New Item',
      category: 'Other',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };

    setEditedReceipt(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: [...prev.items, newItem]
      };
    });

    setEditingItem(newItem.id);
  };

  const categories = [
    'Dairy', 'Meat & Seafood', 'Produce', 'Bakery', 'Pantry',
    'Frozen', 'Beverages', 'Snacks', 'Health & Beauty',
    'Household', 'Baby', 'Pet', 'Other'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review Receipt</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt Image */}
          {editedReceipt.imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: editedReceipt.imageUrl }} style={styles.receiptImage} />
            </View>
          )}

          {/* Store Information */}
          <View style={styles.storeInfo}>
            <TextInput
              style={styles.storeNameInput}
              value={editedReceipt.storeName}
              onChangeText={(text) => setEditedReceipt(prev => prev ? { ...prev, storeName: text } : null)}
              placeholder="Store Name"
            />
            <TextInput
              style={styles.storeLocationInput}
              value={editedReceipt.storeLocation}
              onChangeText={(text) => setEditedReceipt(prev => prev ? { ...prev, storeLocation: text } : null)}
              placeholder="Store Location"
            />
            <Text style={styles.dateText}>
              {editedReceipt.date.toLocaleDateString()}
            </Text>
          </View>

          {/* Items List */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items ({editedReceipt.items.length})</Text>
              <TouchableOpacity onPress={addNewItem} style={styles.addButton}>
                <Plus size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {editedReceipt.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {editingItem === item.id ? (
                  <View style={styles.editingItem}>
                    <TextInput
                      style={styles.itemNameInput}
                      value={item.name}
                      onChangeText={(text) => updateItem(item.id, { name: text })}
                      placeholder="Item name"
                      autoFocus
                    />
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryChip,
                            item.category === category && styles.categoryChipActive
                          ]}
                          onPress={() => updateItem(item.id, { category })}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            item.category === category && styles.categoryChipTextActive
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.priceInputs}>
                      <View style={styles.priceInputGroup}>
                        <Text style={styles.priceLabel}>Qty</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={item.quantity.toString()}
                          onChangeText={(text) => {
                            const quantity = parseInt(text) || 1;
                            const totalPrice = quantity * item.unitPrice;
                            updateItem(item.id, { quantity, totalPrice });
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.priceInputGroup}>
                        <Text style={styles.priceLabel}>Unit Price</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={item.unitPrice.toFixed(2)}
                          onChangeText={(text) => {
                            const unitPrice = parseFloat(text) || 0;
                            const totalPrice = item.quantity * unitPrice;
                            updateItem(item.id, { unitPrice, totalPrice });
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.priceInputGroup}>
                        <Text style={styles.priceLabel}>Total</Text>
                        <Text style={styles.totalPrice}>${item.totalPrice.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.saveEditButton}
                        onPress={() => setEditingItem(null)}
                      >
                        <Save size={16} color="#10b981" />
                        <Text style={styles.saveEditText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemDisplay}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.itemActions}>
                      <Text style={styles.itemPrice}>${item.totalPrice.toFixed(2)}</Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => setEditingItem(item.id)}
                          style={styles.editButton}
                        >
                          <Edit3 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteItem(item.id)}
                          style={styles.deleteButton}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${editedReceipt.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Receipt</Text>
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
  },
  imageContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  storeInfo: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storeNameInput: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 12,
  },
  storeLocationInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  itemsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemDisplay: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#3B82F6',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 6,
  },
  editingItem: {
    padding: 16,
  },
  itemNameInput: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  priceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    textAlign: 'center',
    paddingVertical: 8,
  },
  editActions: {
    alignItems: 'center',
  },
  saveEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveEditText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
    marginLeft: 4,
  },
  totalSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10b981',
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