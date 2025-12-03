import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card } from '../ui';
import { COLORS, SIZES, FONTS } from '../../constants';

const AchievementCard = ({
  achievement,
  isUnlocked = false,
  progress = 0,
  onPress,
  style,
  ...props
}) => {
  const {
    title,
    description,
    icon,
    xpReward,
    category,
    rarity = 'common',
  } = achievement;

  const getRarityColor = () => {
    switch (rarity) {
      case 'legendary':
        return COLORS.warning;
      case 'epic':
        return COLORS.secondary;
      case 'rare':
        return COLORS.primary;
      case 'uncommon':
        return COLORS.success;
      default:
        return COLORS.gray[400];
    }
  };

  const getRarityLabel = () => {
    switch (rarity) {
      case 'legendary':
        return 'Lendária';
      case 'epic':
        return 'Épica';
      case 'rare':
        return 'Rara';
      case 'uncommon':
        return 'Incomum';
      default:
        return 'Comum';
    }
  };

  const renderProgressBar = () => {
    if (isUnlocked || progress === 0) {
      return null;
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(progress * 100, 100)}%`,
                backgroundColor: getRarityColor(),
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    );
  };

  const renderIcon = () => {
    if (!icon) {
      return (
        <View style={[
          styles.iconPlaceholder,
          { backgroundColor: getRarityColor() }
        ]}>
          <Text style={styles.iconText}>🏆</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.iconContainer,
        { borderColor: getRarityColor() }
      ]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
    );
  };

  const CardContent = () => (
    <Card
      variant={isUnlocked ? 'elevated' : 'outlined'}
      style={[
        styles.card,
        !isUnlocked && styles.lockedCard,
        style
      ]}
      {...props}
    >
      <View style={styles.header}>
        {renderIcon()}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !isUnlocked && styles.lockedText
            ]}>
              {title}
            </Text>
            <View style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor() }
            ]}>
              <Text style={styles.rarityText}>
                {getRarityLabel()}
              </Text>
            </View>
          </View>
          <Text style={[
            styles.description,
            !isUnlocked && styles.lockedText
          ]}>
            {description}
          </Text>
        </View>
      </View>

      {renderProgressBar()}

      <View style={styles.footer}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <View style={styles.rewardContainer}>
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        </View>
      </View>

      {isUnlocked && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedText}>✓ Desbloqueada</Text>
        </View>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SIZES.md,
  },
  
  lockedCard: {
    opacity: 0.7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    backgroundColor: COLORS.white,
  },

  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },

  iconText: {
    fontSize: 24,
  },

  headerContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.xs,
  },

  title: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },

  description: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  lockedText: {
    color: COLORS.gray[500],
  },

  rarityBadge: {
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radius.sm,
  },

  rarityText: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },

  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    marginRight: SIZES.sm,
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  progressText: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryContainer: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
  },

  categoryText: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },

  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  xpText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
  },

  unlockedBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
  },

  unlockedText: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
  },
});

export default AchievementCard;