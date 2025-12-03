import React, { useEffect, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { stats } = useSelector((state) => state.user);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const handleBack = () => {
    navigation.goBack();
  };

  // Mock statistics data
  const statisticsData = {
    week: {
      booksRead: 2,
      pagesRead: 156,
      readingTime: 8.5,
      averageSession: 45,
      dailyGoal: 30,
      dailyProgress: 85,
    },
    month: {
      booksRead: 8,
      pagesRead: 624,
      readingTime: 34.2,
      averageSession: 42,
      dailyGoal: 30,
      dailyProgress: 78,
    },
    year: {
      booksRead: 45,
      pagesRead: 3420,
      readingTime: 187.5,
      averageSession: 38,
      dailyGoal: 30,
      dailyProgress: 72,
    },
  };

  const currentStats = statisticsData[selectedPeriod];

  const periods = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
    { key: 'year', label: 'Ano' },
  ];

  const mainStats = [
    {
      title: 'Livros Lidos',
      value: currentStats.booksRead,
      icon: '📚',
      color: COLORS.primary,
    },
    {
      title: 'Páginas Lidas',
      value: currentStats.pagesRead,
      icon: '📄',
      color: COLORS.secondary,
    },
    {
      title: 'Tempo de Leitura',
      value: `${currentStats.readingTime}h`,
      icon: '⏰',
      color: COLORS.success,
    },
    {
      title: 'Sessão Média',
      value: `${currentStats.averageSession}min`,
      icon: '📊',
      color: COLORS.warning,
    },
  ];

  const weeklyData = [
    { day: 'Dom', minutes: 45, pages: 23 },
    { day: 'Seg', minutes: 60, pages: 30 },
    { day: 'Ter', minutes: 30, pages: 15 },
    { day: 'Qua', minutes: 75, pages: 38 },
    { day: 'Qui', minutes: 40, pages: 20 },
    { day: 'Sex', minutes: 55, pages: 28 },
    { day: 'Sáb', minutes: 80, pages: 40 },
  ];

  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes));

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

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period.key && styles.activePeriodText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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


        {/* Daily Goal Progress */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>🎯 Meta Diária</Text>
            <Text style={styles.goalProgress}>
              {currentStats.dailyProgress}% concluída
            </Text>
          </View>
          <View style={styles.goalBar}>
            <View 
              style={[
                styles.goalFill, 
                { width: `${currentStats.dailyProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.goalText}>
            Meta: {currentStats.dailyGoal} minutos por dia
          </Text>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Atividade da Semana</Text>
          <View style={styles.chart}>
            {weeklyData.map((data, index) => {
              const height = (data.minutes / maxMinutes) * 100;
              return (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar, 
                        { height: `${height}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartLabel}>{data.day}</Text>
                  <Text style={styles.chartValue}>{data.minutes}min</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reading Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📅</Text>
            <Text style={styles.insightText}>
              Você lê mais nos fins de semana
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🌙</Text>
            <Text style={styles.insightText}>
              Seu horário preferido é entre 20h-22h
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📖</Text>
            <Text style={styles.insightText}>
              Ficção é seu gênero favorito (65%)
            </Text>
          </View>
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