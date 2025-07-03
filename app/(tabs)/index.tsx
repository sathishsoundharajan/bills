import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, DollarSign } from 'lucide-react-native';
import { FirebaseService } from '@/services/firebaseService';
import DashboardCard from '@/components/DashboardCard';
import TopItemsList from '@/components/TopItemsList';

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
      }
    } catch (err) {
      setError(err.message);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Track your spending insights</Text>
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load data</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
            </View>
          )}

          {/* Summary Cards */}
          <View style={styles.cardsContainer}>
            <DashboardCard
              title="Total Receipts"
              value={analytics?.totalReceipts || 0}
              icon={Receipt}
              color="#10b981"
            />
            <DashboardCard
              title="Total Spent"
              value={`$${(analytics?.totalSpent || 0).toFixed(2)}`}
              icon={DollarSign}
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
    padding: 20,
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
    fontWeight: '500',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
});