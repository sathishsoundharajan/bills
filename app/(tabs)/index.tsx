import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirebaseService } from '../../services/firebaseService';
import DashboardCard from '../../components/DashboardCard';
import TopItemsList from '../../components/TopItemsList';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const result = await FirebaseService.getAnalytics();
      
      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error);
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error && !analytics) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load data</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Dashboard</Text>
          
          {/* Summary Cards */}
          <View style={styles.cardsContainer}>
            <DashboardCard
              title="Total Receipts"
              value={analytics?.totalReceipts || 0}
              icon="receipt-outline"
              color="#10b981"
            />
            <DashboardCard
              title="Total Spent"
              value={`$${(analytics?.totalSpent || 0).toFixed(2)}`}
              icon="cash-outline"
              color="#f59e0b"
            />
          </View>

          {/* Top Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 10 Items Purchased</Text>
            <TopItemsList 
              items={analytics?.topItems || []} 
              type="items"
            />
          </View>

          {/* Top Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Spending Categories</Text>
            <TopItemsList 
              items={analytics?.topCategories || []} 
              type="categories"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
});