import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt, DollarSign } from 'lucide-react-native';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function DashboardCard({ title, value, icon, color }: DashboardCardProps) {
  const IconComponent = icon === 'receipt-outline' ? Receipt : DollarSign;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconComponent size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});