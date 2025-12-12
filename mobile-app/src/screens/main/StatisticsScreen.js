import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const { stats } = useSelector((state) => state.user);

  const handleBack = () => {
    navigation.goBack();
  };

  const zeroStats = {
    booksRead: 0,
    pagesRead: 0,
    readingTime: 0,
    averageSession: 0,
  };

  const mainStats = [
    {
      title: 'Livros Lidos',
      value: zeroStats.booksRead,
      icon: '📚',
      color: COLORS.primary,
    },
    {
      title: 'Páginas Lidas',
      value: zeroStats.pagesRead,
      icon: '📄',
      color: COLORS.secondary,
    },
    {
      title: 'Tempo de Leitura',
      value: `${zeroStats.readingTime}h`,
      icon: '⏰',
      color: COLORS.success,
    },
    {
      title: 'Sessão Média',
      value: `${zeroStats.averageSession}min`,
      icon: '📊',
      color: COLORS.warning,
    },
  ];

  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Logo.Header
          leftComponent={
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.backText}>‹ Voltar</Text>
            </TouchableOpacity>
          }
        />

        <Text style={styles.title}>Estatísticas</Text>

        

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          {mainStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Text style={styles.statEmoji}>{stat.icon}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>


        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
  backText: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  title: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.xs,
    marginBottom: SIZES.xl,
    ...SHADOWS.light,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderRadius: SIZES.radius.sm,
  },
  activePeriodButton: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  activePeriodText: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
    ...SHADOWS.light,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  statTitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
    ...SHADOWS.light,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  goalTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  goalProgress: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  goalBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginBottom: SIZES.sm,
  },
  goalFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  goalText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
    ...SHADOWS.light,
  },
  chartTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: SIZES.xs,
  },
  chartBar: {
    width: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  chartValue: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  insightsCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  insightsTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: SIZES.sm,
  },
  insightText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
});

export default StatisticsScreen;
