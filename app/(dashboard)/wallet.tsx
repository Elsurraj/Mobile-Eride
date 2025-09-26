import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActionButton from '@/components/common/ActionButton';
import BottomNav from '@/components/BottomNav';

export default function WalletScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Hardcoded wallet data
  const walletBalance = "₦2,500.00";
  const recentTransactions = [
    { id: 1, type: "Ride Payment", amount: "-₦500.00", date: "2023-05-15", time: "10:30 AM" },
    { id: 2, type: "Top-up", amount: "+₦3,000.00", date: "2023-05-10", time: "2:15 PM" },
    { id: 3, type: "Ride Payment", amount: "-₦750.00", date: "2023-05-08", time: "8:45 AM" },
    { id: 4, type: "Delivery Payment", amount: "-₦300.00", date: "2023-05-05", time: "6:20 PM" },
  ];

  const handleTopUp = () => {
    Alert.alert('Top Up', 'Top-up functionality will be implemented soon!');
  };

  const handleWithdraw = () => {
    Alert.alert('Withdraw', 'Withdraw functionality will be implemented soon!');
  };

  const handleTransactionDetails = (transaction: any) => {
    Alert.alert(
      'Transaction Details',
      `Type: ${transaction.type}\nAmount: ${transaction.amount}\nDate: ${transaction.date} at ${transaction.time}`
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: Spacing['3xl'],
    },
    balanceCard: {
      backgroundColor: colors.brand.primary,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.xl,
      marginBottom: Spacing['2xl'],
      ...Shadows.lg,
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    balanceLabel: {
      fontSize: Typography.fontSize.sm,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    balanceAmount: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      color: '#FFFFFF',
      marginBottom: Spacing.md,
    },
    cardIcon: {
      opacity: 0.8,
    },
    quickActionsSection: {
      marginBottom: Spacing['2xl'],
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    quickActionButton: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    transactionCard: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    transactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionLeft: {
      flex: 1,
    },
    transactionType: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginBottom: Spacing.xs / 2,
    },
    transactionDate: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    transactionAmount: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
    },
    positiveAmount: {
      color: colors.success,
    },
    negativeAmount: {
      color: colors.error,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    emptyMessage: {
      fontSize: Typography.fontSize.base,
      color: colors.textLight,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <DashboardLayout title="Wallet" showHeader={true}>
        <View style={styles.content}>
          {/* Wallet Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Ionicons
                name="card"
                size={32}
                color="#FFFFFF"
                style={styles.cardIcon}
              />
            </View>
            <Text style={styles.balanceAmount}>{walletBalance}</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsGrid}>
              <ActionButton
                label="Top Up"
                icon="add-outline"
                onPress={handleTopUp}
                variant="primary"
                fullWidth
                style={styles.quickActionButton}
              />
              <ActionButton
                label="Withdraw"
                icon="remove-outline"
                onPress={handleWithdraw}
                variant="secondary"
                fullWidth
                style={styles.quickActionButton}
              />
            </View>
          </View>

          {/* Recent Transactions */}
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => handleTransactionDetails(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionType}>
                      {transaction.type}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {transaction.date} • {transaction.time}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.amount.startsWith('+')
                        ? styles.positiveAmount
                        : styles.negativeAmount,
                    ]}
                  >
                    {transaction.amount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptyMessage}>
                Your transaction history will appear here
              </Text>
            </View>
          )}
        </View>
      </DashboardLayout>
      <BottomNav />
    </View>
  );
}
