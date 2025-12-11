import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Card } from '../ui';
import { COLORS, SIZES, FONTS } from '../../constants';

const LevelProgress = ({
  currentLevel = 1,
  currentXP = 0,
  xpToNextLevel = 100,
  totalXP = 0,
  animated = true,
  showDetails = true,
  style,
  ...props
}) => {
  const progress = Math.min(currentXP / xpToNextLevel, 1);
  const progressPercentage = Math.round(progress * 100);
  
  const getLevelColor = (level) => {
    if (level >= 50) return COLORS.warning; // Gold
    if (level >= 25) return COLORS.secondary; // Purple
    if (level >= 10) return COLORS.primary; // Blue
    if (level >= 5) return COLORS.success; // Green
    return COLORS.gray[400]; // Gray
  };
  
  const getLevelTitle = (level) => {
    if (level >= 50) return 'Mestre Leitor';
    if (level >= 25) return 'Leitor Experiente';
    if (level >= 10) return 'Leitor Avançado';
    if (level >= 5) return 'Leitor Dedicado';
    return 'Leitor Iniciante';
  };
  
  const renderLevelBadge = () => {
    const levelColor = getLevelColor(currentLevel);
    
    return (
      <View style={[
        styles.levelBadge,
        { backgroundColor: levelColor }
      ]}>
        <Text style={styles.levelNumber}>{currentLevel}</Text>
        <Text style={styles.levelLabel}>NÍVEL</Text>
      </View>
    );
  };
  
  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${progressPercentage}%`,
                backgroundColor: getLevelColor(currentLevel),
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentXP} / {xpToNextLevel} XP
        </Text>
      </View>
    );
  };
  
  const renderXPStats = () => {
    if (!showDetails) return null;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
          <Text style={styles.statLabel}>XP Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{xpToNextLevel - currentXP}</Text>
          <Text style={styles.statLabel}>XP Restante</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressPercentage}%</Text>
          <Text style={styles.statLabel}>Progresso</Text>
        </View>
      </View>
    );
  };
  
  return (
    <Card
      variant="elevated"
      style={[styles.card, style]}
      {...props}
    >
      <View style={styles.header}>
        {renderLevelBadge()}
        <View style={styles.headerContent}>
          <Text style={styles.levelTitle}>
            {getLevelTitle(currentLevel)}
          </Text>
          <Text style={styles.nextLevelText}>
            Próximo nível: {currentLevel + 1}
          </Text>
        </View>
      </View>
      
      {renderProgressBar()}
      {renderXPStats()}
    </Card>
  );
};

// Componente compacto para uso em headers ou cards menores
LevelProgress.Compact = ({
  currentLevel = 1,
  currentXP = 0,
  xpToNextLevel = 100,
  style,
  ...props
}) => {
  const progress = Math.min(currentXP / xpToNextLevel, 1);
  const levelColor = currentLevel >= 50 ? COLORS.warning :
                    currentLevel >= 25 ? COLORS.secondary :
                    currentLevel >= 10 ? COLORS.primary :
                    currentLevel >= 5 ? COLORS.success :
                    COLORS.gray[400];
  
  return (
    <View style={[styles.compactContainer, style]} {...props}>
      <View style={[
        styles.compactLevelBadge,
        { backgroundColor: levelColor }
      ]}>
        <Text style={styles.compactLevelText}>{currentLevel}</Text>
      </View>
      
      <View style={styles.compactContent}>
        <View style={styles.compactProgressBar}>
          <View 
            style={[
              styles.compactProgressFill,
              { 
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: levelColor,
              }
            ]} 
          />
        </View>
        <Text style={styles.compactXPText}>
          {currentXP}/{xpToNextLevel} XP
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SIZES.md,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  
  levelNumber: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    lineHeight: SIZES.fontSize.xl,
  },
  
  levelLabel: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
    marginTop: -2,
  },
  
  headerContent: {
    flex: 1,
  },
  
  levelTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  
  nextLevelText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  
  progressContainer: {
    marginBottom: SIZES.md,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginBottom: SIZES.xs,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  
  statLabel: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray[200],
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
  },
  
  compactLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  
  compactLevelText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  
  compactContent: {
    flex: 1,
  },
  
  compactProgressBar: {
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    marginBottom: SIZES.xs,
  },
  
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  compactXPText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
  },
});

export default LevelProgress;