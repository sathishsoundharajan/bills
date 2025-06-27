import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, Receipt, Package, Store, Plus, User as UserIcon, Camera, FileText, ChartBar as BarChart3, Settings } from 'lucide-react-native';
import { DashboardStats, User } from '@/types';
import { SecureDataService } from '@/services/secureDataService';
import ManualSpendingModal from '@/components/ManualSpendingModal';
import AuthModal from '@/components/AuthModal';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const dataService = SecureDataService.getInstance();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Try to restore user session
      const restoredUser = await dataService.restoreUserSession();
      if (restoredUser) {
        setUser(restoredUser);
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await dataService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleAuthSuccess = async () => {
    const currentUser = dataService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      await loadDashboardData();
    }
  };

  const handleManualEntrySaved = () => {
    loadDashboardData();
  };

  const navigateToScan = () => {
    router.push('/(tabs)/scan');
  };

  const navigateToItems = () => {
    router.push('/(tabs)/items');
  };

  const navigateToStores = () => {
    router.push('/(tabs)/stores');
  };

  const navigateToProfile = () => {
    router.push('/(tabs)/profile');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        navigateToScan();
        break;
      case 'manual':
        setShowManualModal(true);
        break;
      case 'analytics':
        navigateToItems();
        break;
      case 'settings':
        navigateToProfile();
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Receipt Scanner</Text>
          <Text style={styles.headerSubtitle}>Loading your data...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Receipt Scanner</Text>
          <Text style={styles.headerSubtitle}>Track your spending smartly</Text>
        </LinearGradient>

        <View style={styles.authPrompt}>
          <UserIcon size={64} color="#3B82F6" />
          <Text style={styles.authTitle}>Welcome to Receipt Scanner</Text>
          <Text style={styles.authDescription}>
            Sign in to start tracking your receipts and spending patterns with advanced ML categorization
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={styles.signInButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </SafeAreaView>
    );
  }

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  const lineData = {
    labels: stats?.monthlySpending.map(item => item.month) || ['Jan'],
    datasets: [
      {
        data: stats?.monthlySpending.length ? 
          stats.monthlySpending.map(item => item.amount) : [0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const pieData = stats?.topCategories.map((category, index) => ({
    name: category.category,
    population: category.amount,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5],
    legendFontColor: '#374151',
    legendFontSize: 12,
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Welcome back!</Text>
              <Text style={styles.headerSubtitle}>{user.displayName}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowManualModal(true)}
            >
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => handleQuickAction('scan')}
          >
            <Camera size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Scan Receipt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => handleQuickAction('manual')}
          >
            <FileText size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={navigateToItems}>
              <Receipt size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{stats?.totalReceipts || 0}</Text>
              <Text style={styles.statLabel}>Receipts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={navigateToItems}>
              <Package size={24} color="#10B981" />
              <Text style={styles.statNumber}>{stats?.totalItems || 0}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={navigateToItems}>
              <TrendingUp size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>${stats?.totalSpent.toFixed(2) || '0.00'}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={navigateToStores}>
              <Store size={24} color="#EF4444" />
              <Text style={styles.statNumber}>{stats?.favoriteStore || 'N/A'}</Text>
              <Text style={styles.statLabel}>Top Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCardsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('analytics')}
          >
            <BarChart3 size={24} color="#8B5CF6" />
            <Text style={styles.actionCardText}>View Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('settings')}
          >
            <Settings size={24} color="#6B7280" />
            <Text style={styles.actionCardText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Spending Chart */}
        {stats?.monthlySpending && stats.monthlySpending.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
            <LineChart
              data={lineData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Spending Chart */}
        {stats?.topCategories && stats.topCategories.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Top Items */}
        {stats?.topItems && stats.topItems.length > 0 && (
          <View style={styles.topItemsContainer}>
            <Text style={styles.sectionTitle}>Most Purchased Items</Text>
            {stats.topItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.topItemCard} onPress={navigateToItems}>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemDetail}>{item.count} purchases</Text>
                </View>
                <Text style={styles.topItemAmount}>${item.totalSpent.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {(!stats || stats.totalReceipts === 0) && (
          <View style={styles.emptyState}>
            <Receipt size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No receipts yet</Text>
            <Text style={styles.emptyDescription}>
              Start by scanning your first receipt or adding a manual entry
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={navigateToScan}
              >
                <Camera size={20} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Scan Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emptyButtonSecondary}
                onPress={() => setShowManualModal(true)}
              >
                <FileText size={20} color="#3B82F6" />
                <Text style={styles.emptyButtonTextSecondary}>Manual Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <ManualSpendingModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleManualEntrySaved}
      />
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    marginTop: -20,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginLeft: 12,
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  actionCardsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1f2937',
    marginLeft: 8,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  topItemsContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  topItemCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  topItemDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  topItemAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10b981',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  authDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
  emptyButtonSecondary: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  emptyButtonTextSecondary: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginLeft: 8,
  },
});