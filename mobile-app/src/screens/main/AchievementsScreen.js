import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';
import { fetchAchievements } from '../../store/slices/gamificationSlice';
import { selectAchievements } from '../../store/slices/gamificationSlice';

const AchievementsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const achievementsState = useSelector(selectAchievements);

  const handleBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    dispatch(fetchAchievements());
  }, [dispatch]);

  const allAchievements = (achievementsState.available || []).map(a => ({
    id: a.id,
    title: a.name,
    description: a.description,
    icon: a.icon || '📘',
    unlocked: !!a.unlocked,
    progress: a.progress || 0,
    maxProgress: a.maxProgress || 1,
    xpReward: a.experience || 0,
    unlockedAt: a.unlockedAt || null,
  }));
  const removedIds = new Set(['note_taker','challenge_seeker','genre_explorer']);
  const visibleAchievements = allAchievements.filter(a => !removedIds.has(a.id));

  const unlockedAchievements = visibleAchievements.filter(a => a.unlocked);
  const lockedAchievements = visibleAchievements.filter(a => !a.unlocked);

  const renderAchievement = ({ item }) => {
    const progressPercentage = (item.progress / item.maxProgress) * 100;
    
    return (
      <View style={[styles.achievementCard, !item.unlocked && styles.lockedCard]}>
        <View style={styles.achievementHeader}>
          <View style={[styles.iconContainer, !item.unlocked && styles.lockedIcon]}>
            <Text style={styles.achievementIcon}>{item.icon}</Text>
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, !item.unlocked && styles.lockedText]}>
              {item.title}
            </Text>
            <Text style={[styles.achievementDescription, !item.unlocked && styles.lockedText]}>
              {item.description}
            </Text>
          </View>
          {item.unlocked && (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedText}>✓</Text>
            </View>
          )}
        </View>
        
        {!item.unlocked && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {item.progress}/{item.maxProgress}
              </Text>

            </View>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
              />
            </View>
          </View>
        )}
        
        {item.unlocked && item.unlockedAt && (
          <View style={styles.unlockedInfo}>
            <Text style={styles.unlockedDate}>
              Desbloqueado em {new Date(item.unlockedAt).toLocaleDateString('pt-BR')}
            </Text>

          </View>
        )}
      </View>
    );
  };

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

        <Text style={styles.title}>Conquistas</Text>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Desbloqueadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{visibleAchievements.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {visibleAchievements.length > 0 ? Math.round((unlockedAchievements.length / visibleAchievements.length) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Progresso</Text>
          </View>
        </View>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Conquistas Desbloqueadas</Text>
            <FlatList
              data={unlockedAchievements}
              renderItem={renderAchievement}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Em Progresso</Text>
            <FlatList
              data={lockedAchievements}
              renderItem={renderAchievement}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
    ...SHADOWS.medium,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  achievementCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  lockedIcon: {
    backgroundColor: COLORS.gray[200],
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  achievementDescription: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  lockedText: {
    color: COLORS.gray[400],
  },
  unlockedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  progressSection: {
    marginTop: SIZES.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  progressText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },

  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  unlockedInfo: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockedDate: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
  },

});

export default AchievementsScreen;
