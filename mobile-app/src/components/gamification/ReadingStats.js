import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card } from '../ui';
import { COLORS, SIZES, FONTS } from '../../constants';

const ReadingStats = ({
  stats = {},
  period = 'week', // week, month, year, all
  style,
  ...props
}) => {
  const {
    booksRead = 0,
    chaptersRead = 0,
    pagesRead = 0,
    readingTime = 0, // in minutes
    streak = 0,
    averageRating = 0,
    favoriteGenre = '',
    totalXP = 0,
    achievementsUnlocked = 0,
  } = stats;

  const formatReadingTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      case 'year':
        return 'Este Ano';
      default:
        return 'Total';
    }
  };

  const getStreakColor = () => {
    if (streak >= 30) return COLORS.warning;
    if (streak >= 14) return COLORS.secondary;
    if (streak >= 7) return COLORS.primary;
    if (streak >= 3) return COLORS.success;
    return COLORS.gray[400];
  };

  const renderMainStats = () => {
    const mainStats = [
      {
        value: booksRead,
        label: 'Livros Lidos',
        icon: '📚',
        color: COLORS.primary,
      },
      {
        value: chaptersRead,
        label: 'Capítulos',
        icon: '📖',
        color: COLORS.success,
      },
      {
        value: pagesRead,
        label: 'Páginas',
        icon: '📄',
        color: COLORS.secondary,
      },
      {
        value: formatReadingTime(readingTime),
        label: 'Tempo de Leitura',
        icon: '⏱️',
        color: COLORS.warning,
      },
    ];

    return (
      <View style={styles.mainStatsContainer}>
        {mainStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[
              styles.statIcon,
              { backgroundColor: `${stat.color}20` }
            ]}>
              <Text style={styles.statIconText}>{stat.icon}</Text>
            </View>
            <Text style={[
              styles.statValue,
              { color: stat.color }
            ]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSecondaryStats = () => {
    return (
      <View style={styles.secondaryStatsContainer}>
        <View style={styles.secondaryStatRow}>
          <View style={styles.secondaryStatItem}>
            <View style={styles.secondaryStatHeader}>
              <Text style={styles.secondaryStatIcon}>🔥</Text>
              <Text style={styles.secondaryStatLabel}>Sequência</Text>
            </View>
            <Text style={[
              styles.secondaryStatValue,
              { color: getStreakColor() }
            ]}>
              {streak} dias
            </Text>
          </View>
          
          <View style={styles.secondaryStatDivider} />
          
          <View style={styles.secondaryStatItem}>
            <View style={styles.secondaryStatHeader}>
              <Text style={styles.secondaryStatIcon}>⭐</Text>
              <Text style={styles.secondaryStatLabel}>Avaliação Média</Text>
            </View>
            <Text style={[
              styles.secondaryStatValue,
              { color: COLORS.warning }
            ]}>
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.secondaryStatRow}>
          <View style={styles.secondaryStatItem}>
            <View style={styles.secondaryStatHeader}>
              <Text style={styles.secondaryStatIcon}>🎯</Text>
              <Text style={styles.secondaryStatLabel}>XP Ganho</Text>
            </View>
            <Text style={[
              styles.secondaryStatValue,
              { color: COLORS.primary }
            ]}>
              {totalXP.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.secondaryStatDivider} />
          
          <View style={styles.secondaryStatItem}>
            <View style={styles.secondaryStatHeader}>
              <Text style={styles.secondaryStatIcon}>🏆</Text>
              <Text style={styles.secondaryStatLabel}>Conquistas</Text>
            </View>
            <Text style={[
              styles.secondaryStatValue,
              { color: COLORS.success }
            ]}>
              {achievementsUnlocked}
            </Text>
          </View>
        </View>

        {favoriteGenre && (
          <View style={styles.favoriteGenreContainer}>
            <Text style={styles.favoriteGenreLabel}>Gênero Favorito:</Text>
            <View style={styles.favoriteGenreBadge}>
              <Text style={styles.favoriteGenreText}>{favoriteGenre}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Card
      title={`Estatísticas - ${getPeriodLabel()}`}
      variant="elevated"
      style={[styles.card, style]}
      {...props}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderMainStats()}
        {renderSecondaryStats()}
      </ScrollView>
    </Card>
  );
};

// Componente compacto para uso em dashboards
ReadingStats.Compact = ({
  stats = {},
  style,
  ...props
}) => {
  const {
    booksRead = 0,
    readingTime = 0,
    streak = 0,
  } = stats;

  const formatReadingTime = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <View style={[styles.compactContainer, style]} {...props}>
      <View style={styles.compactStat}>
        <Text style={styles.compactValue}>{booksRead}</Text>
        <Text style={styles.compactLabel}>Livros</Text>
      </View>
      <View style={styles.compactDivider} />
      <View style={styles.compactStat}>
        <Text style={styles.compactValue}>{formatReadingTime(readingTime)}</Text>
        <Text style={styles.compactLabel}>Tempo</Text>
      </View>
      <View style={styles.compactDivider} />
      <View style={styles.compactStat}>
        <Text style={[
          styles.compactValue,
          { color: streak >= 7 ? COLORS.success : COLORS.text }
        ]}>
          {streak}
        </Text>
        <Text style={styles.compactLabel}>Sequência</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SIZES.md,
  },
  
  scrollContent: {
    paddingBottom: SIZES.sm,
  },
  
  mainStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.sm,
  },
  
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  
  statIconText: {
    fontSize: 20,
  },
  
  statValue: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    marginBottom: SIZES.xs,
  },
  
  statLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  secondaryStatsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
  },
  
  secondaryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  
  secondaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  secondaryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  
  secondaryStatIcon: {
    fontSize: 16,
    marginRight: SIZES.xs,
  },
  
  secondaryStatLabel: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
  },
  
  secondaryStatValue: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
  },
  
  secondaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SIZES.md,
  },
  
  favoriteGenreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.sm,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  
  favoriteGenreLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SIZES.sm,
  },
  
  favoriteGenreBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
  },
  
  favoriteGenreText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.sm,
  },
  
  compactStat: {
    flex: 1,
    alignItems: 'center',
  },
  
  compactValue: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  
  compactLabel: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
  },
  
  compactDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray[200],
  },
});

export default ReadingStats;