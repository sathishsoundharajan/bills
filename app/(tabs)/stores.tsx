import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-chart-kit';
import { Store, MapPin, DollarSign, Star, TrendingUp } from 'lucide-react-native';
import { mockStores, mockReceipts } from '@/services/mockData';

const screenWidth = Dimensions.get('window').width;

export default function StoresScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Month');

  // Calculate store statistics
  const storeStats = mockStores.map(store => {
    const storeReceipts = mockReceipts.filter(receipt => receipt.storeName === store.name);
    const totalSpent = storeReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const totalVisits = storeReceipts.length;
    const avgSpent = totalVisits > 0 ? totalSpent / totalVisits : 0;
    const totalItems = storeReceipts.reduce((sum, receipt) => sum + receipt.items.length, 0);

    return {
      ...store,
      totalSpent,
      totalVisits,
      avgSpent,
      totalItems,
      rating: 4.2 + Math.random() * 0.8, // Mock rating
    };
  });

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
  };

  const spendingData = {
    labels: storeStats.map(store => store.name.substring(0, 8)),
    datasets: [
      {
        data: storeStats.map(store => store.totalSpent),
      },
    ],
  };

  const periods = ['Week', 'Month', 'Quarter', 'Year'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Stores & Trends</Text>
          <Text style={styles.headerSubtitle}>Compare prices across stores</Text>
        </LinearGradient>

        {/* Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodContainer}
        >
          {periods.map((period, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.periodChip,
                selectedPeriod === period && styles.periodChipActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodChipText,
                selectedPeriod === period && styles.periodChipTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Spending by Store Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Spending by Store</Text>
          <BarChart
            data={spendingData}
            width={screenWidth - 72}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            showBarTops={false}
            showValuesOnTopOfBars={true}
          />
        </View>

        {/* Store Rankings */}
        <View style={styles.rankingsContainer}>
          <Text style={styles.sectionTitle}>Store Rankings</Text>
          
          {/* Best Value Store */}
          <View style={styles.rankingCard}>
            <View style={styles.rankingHeader}>
              <DollarSign size={24} color="#10b981" />
              <Text style={styles.rankingTitle}>Best Value</Text>
            </View>
            <Text style={styles.rankingStore}>Walmart</Text>
            <Text style={styles.rankingDetail}>Average savings: $12.34 per visit</Text>
          </View>

          {/* Most Visited */}
          <View style={styles.rankingCard}>
            <View style={styles.rankingHeader}>
              <TrendingUp size={24} color="#3B82F6" />
              <Text style={styles.rankingTitle}>Most Visited</Text>
            </View>
            <Text style={styles.rankingStore}>Target</Text>
            <Text style={styles.rankingDetail}>15 visits this month</Text>
          </View>
        </View>

        {/* Store List */}
        <View style={styles.storesContainer}>
          <Text style={styles.sectionTitle}>Your Stores</Text>
          {storeStats.map((store, index) => (
            <TouchableOpacity key={index} style={styles.storeCard}>
              <View style={styles.storeIcon}>
                <Store size={24} color="#3B82F6" />
              </View>
              
              <View style={styles.storeInfo}>
                <View style={styles.storeHeader}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <View style={styles.storeRating}>
                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
                  </View>
                </View>
                
                <View style={styles.storeLocation}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.locationText}>{store.location}</Text>
                </View>
                
                <View style={styles.storeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{store.totalVisits}</Text>
                    <Text style={styles.statLabel}>Visits</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${store.totalSpent.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Spent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${store.avgSpent.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Avg</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{store.totalItems}</Text>
                    <Text style={styles.statLabel}>Items</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Comparison */}
        <View style={styles.comparisonContainer}>
          <Text style={styles.sectionTitle}>Price Comparison</Text>
          
          <View style={styles.comparisonTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
              <Text style={styles.tableHeaderText}>Walmart</Text>
              <Text style={styles.tableHeaderText}>Target</Text>
              <Text style={styles.tableHeaderText}>Safeway</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Milk (1 gal)</Text>
              <Text style={[styles.tableCell, styles.bestPrice]}>$3.99</Text>
              <Text style={styles.tableCell}>$4.29</Text>
              <Text style={styles.tableCell}>$4.49</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Bread</Text>
              <Text style={styles.tableCell}>$2.49</Text>
              <Text style={[styles.tableCell, styles.bestPrice]}>$2.29</Text>
              <Text style={styles.tableCell}>$2.69</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Eggs (12ct)</Text>
              <Text style={styles.tableCell}>$3.49</Text>
              <Text style={styles.tableCell}>$3.79</Text>
              <Text style={[styles.tableCell, styles.bestPrice]}>$3.29</Text>
            </View>
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
  },
  periodContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  periodChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodChipActive: {
    backgroundColor: '#3B82F6',
  },
  periodChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  periodChipTextActive: {
    color: '#ffffff',
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
  rankingsContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  rankingCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginLeft: 12,
  },
  rankingStore: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  rankingDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  storesContainer: {
    margin: 20,
    marginTop: 0,
  },
  storeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  storeIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1f2937',
    marginLeft: 4,
  },
  storeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginLeft: 6,
  },
  storeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  comparisonContainer: {
    margin: 20,
    marginTop: 0,
  },
  comparisonTable: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1f2937',
    textAlign: 'center',
  },
  bestPrice: {
    color: '#10b981',
    fontFamily: 'Inter-SemiBold',
  },
});