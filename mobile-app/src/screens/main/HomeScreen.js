import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { fetchBooks } from '../../store/slices/booksSlice';

import { Logo } from '../../components';
import ui from '../../theme/ui';
import externalBooksAPI from '../../services/externalBooksAPI';
import { fetchGoalsProgress, fetchUserGoals } from '../../store/slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
const { gutendexAPI, bookUtils } = externalBooksAPI;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { books, isLoading: booksLoading } = useSelector((state) => state.books);
  const { stats, goals, isLoadingGoals } = useSelector((state) => state.user);
  
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [homeGoals, setHomeGoals] = useState([]);
  const [homeGoalBaselines, setHomeGoalBaselines] = useState({});
  const [homeGoalLast, setHomeGoalLast] = useState({});
  

  useEffect(() => {
    dispatch(fetchBooks({ limit: 5, featured: true }));
    loadFeaturedBooks();
    dispatch(fetchGoalsProgress());
    dispatch(fetchUserGoals());
    loadCachedGoals();
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchUserGoals());
      loadCachedGoals();
    }, [dispatch])
  );

  const userId = (user && (user._id || user.id || user.userId)) || 'anonymous';
  const cacheKey = `userGoals:${userId}`;
  const baselineKeyFor = (id) => `goalBaseline:${userId}:${id}`;
  const lastKeyFor = (id) => `goalLastProgress:${userId}:${id}`;

  const loadCachedGoals = async () => {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHomeGoals(arr);
      }
    } catch (e) {}
  };
  const loadBaselines = async (goalsList) => {
    try {
      const entries = Array.isArray(goalsList) ? goalsList : [];
      const result = {};
      for (const g of entries) {
        const id = g._id || g.id; if (!id) continue;
        const raw = await AsyncStorage.getItem(baselineKeyFor(id));
        if (raw) { try { result[id] = JSON.parse(raw); } catch {} }
      }
      setHomeGoalBaselines(result);
    } catch {}
  };
  const loadLast = async (goalsList) => {
    try {
      const entries = Array.isArray(goalsList) ? goalsList : [];
      const result = {};
      for (const g of entries) {
        const id = g._id || g.id; if (!id) continue;
        const raw = await AsyncStorage.getItem(lastKeyFor(id));
        if (raw) { try { const num = JSON.parse(raw); if (typeof num === 'number') result[id] = num; } catch {} }
      }
      setHomeGoalLast(result);
    } catch {}
  };

  const displayGoals = useMemo(() => {
    const baseGoals = Array.isArray(goals) ? goals : [];
    return [...homeGoals.filter(lg => !baseGoals.some(bg => bg._id === lg._id)), ...baseGoals];
  }, [homeGoals, goals]);
  useEffect(() => { loadBaselines(displayGoals); loadLast(displayGoals); }, [displayGoals]);
  useEffect(() => {
    const run = async () => {
      const key = `alertedGoals:${(user && (user._id || user.id || user.userId)) || 'anonymous'}`;
      let alerted = [];
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) alerted = arr;
        }
      } catch {}
      const next = [...alerted];
      displayGoals.forEach(g => {
        const id = g._id || g.id;
        const base = id ? homeGoalBaselines[id] : undefined;
        let currentVal = g.current || 0;
        if (base) {
          if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
          if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
          if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
        }
        const last = id ? homeGoalLast[id] : undefined;
        const target = g.target || 0;
        const justCompleted = typeof last === 'number' && last < target && currentVal >= target && currentVal > last && g.active !== false;
        if (justCompleted && id && !next.includes(id)) {
          Alert.alert('Meta concluída', g.title || 'Meta');
          next.push(id);
        }
      });
      try { await AsyncStorage.setItem(key, JSON.stringify(next)); } catch {}
    };
    run();
  }, [displayGoals, stats?.goalsProgress?.dailyMinutes, stats?.goalsProgress?.weeklyBooks, stats?.goalsProgress?.monthlyBooks]);

  useEffect(() => {
    const run = async () => {
      const key = `alertedBuiltins:${(user && (user._id || user.id || user.userId)) || 'anonymous'}`;
      let alerted = {};
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object') alerted = obj;
        }
      } catch {}
      const dailyPct = Math.min(100, Math.round(((stats?.goalsProgress?.dailyMinutes || 0) / (stats?.readingGoals?.daily || 1)) * 100));
      const weeklyPct = Math.min(100, Math.round(((stats?.goalsProgress?.weeklyBooks || 0) / (stats?.readingGoals?.weekly || 1)) * 100));
      const monthlyPct = Math.min(100, Math.round(((stats?.goalsProgress?.monthlyBooks || 0) / (stats?.readingGoals?.monthly || 1)) * 100));
      let changed = false;
      if (dailyPct >= 100 && !alerted.daily) { Alert.alert('Meta diária concluída', 'Parabéns!'); alerted.daily = true; changed = true; }
      if (weeklyPct >= 100 && !alerted.weekly) { Alert.alert('Meta semanal concluída', 'Parabéns!'); alerted.weekly = true; changed = true; }
      if (monthlyPct >= 100 && !alerted.monthly) { Alert.alert('Meta mensal concluída', 'Parabéns!'); alerted.monthly = true; changed = true; }
      if (changed) { try { await AsyncStorage.setItem(key, JSON.stringify(alerted)); } catch {} }
    };
    run();
  }, [stats?.goalsProgress?.dailyMinutes, stats?.goalsProgress?.weeklyBooks, stats?.goalsProgress?.monthlyBooks, stats?.readingGoals?.daily, stats?.readingGoals?.weekly, stats?.readingGoals?.monthly]);

  const loadFeaturedBooks = async () => {
    try {
      setLoadingBooks(true);
      const result = await gutendexAPI.search('');
      const formattedBooks = (result.books || []).map(book => bookUtils.formatBookData(book));
      setFeaturedBooks(formattedBooks.slice(0, 12));
    } catch (error) {
      console.error('Erro ao carregar livros em destaque:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  

  const handleBookPress = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id });
  };

  const handleSeeAllBooks = () => {
    navigation.navigate('Library');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={ui.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Logo.Header
          rightComponent={
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                </Text>
              </View>
            </TouchableOpacity>
          }
        />
        
        <View style={[styles.greetingContainer, ui.screenPadding]}>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.userName}>{user?.name || 'Leitor'}! 👋</Text>
        </View>

        {/* Stats removidos conforme solicitação */}

        <View style={ui.section}>
          <View style={[styles.sectionHeader, ui.screenPadding]}>
            <Text style={ui.sectionTitle}>Metas de Leitura</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReadingGoals')}>
              <Text style={styles.seeAllText}>Configurar</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.goalsCardRow, ui.screenPadding]}>
            <View style={[styles.goalCard, ui.card]}>
              <Text style={styles.goalIcon}>🎯</Text>
              <Text style={styles.goalTitle}>Meta diária</Text>
              <Text style={styles.goalValue}>{stats?.readingGoals?.daily || 0} min</Text>
              <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min(100, Math.round(((stats?.goalsProgress?.dailyMinutes || 0) / (stats?.readingGoals?.daily || 1)) * 100))}%` }]} /></View>
              <Text style={styles.goalSub}>{(stats?.goalsProgress?.dailyMinutes || 0)} min hoje</Text>
              {Math.min(100, Math.round(((stats?.goalsProgress?.dailyMinutes || 0) / (stats?.readingGoals?.daily || 1)) * 100)) >= 100 && (
                <Text style={styles.goalSub}>Concluída</Text>
              )}
            </View>
            <View style={[styles.goalCard, ui.card]}>
              <Text style={styles.goalIcon}>📅</Text>
              <Text style={styles.goalTitle}>Meta semanal</Text>
              <Text style={styles.goalValue}>{stats?.readingGoals?.weekly || 0} livros</Text>
              <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min(100, Math.round(((stats?.goalsProgress?.weeklyBooks || 0) / (stats?.readingGoals?.weekly || 1)) * 100))}%` }]} /></View>
              <Text style={styles.goalSub}>{(stats?.goalsProgress?.weeklyBooks || 0)} livros nesta semana</Text>
              {Math.min(100, Math.round(((stats?.goalsProgress?.weeklyBooks || 0) / (stats?.readingGoals?.weekly || 1)) * 100)) >= 100 && (
                <Text style={styles.goalSub}>Concluída</Text>
              )}
            </View>
            <View style={[styles.goalCard, ui.card]}>
              <Text style={styles.goalIcon}>🗓️</Text>
              <Text style={styles.goalTitle}>Meta mensal</Text>
              <Text style={styles.goalValue}>{stats?.readingGoals?.monthly || 0} livros</Text>
              <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min(100, Math.round(((stats?.goalsProgress?.monthlyBooks || 0) / (stats?.readingGoals?.monthly || 1)) * 100))}%` }]} /></View>
              <Text style={styles.goalSub}>{(stats?.goalsProgress?.monthlyBooks || 0)} livros neste mês</Text>
              {Math.min(100, Math.round(((stats?.goalsProgress?.monthlyBooks || 0) / (stats?.readingGoals?.monthly || 1)) * 100)) >= 100 && (
                <Text style={styles.goalSub}>Concluída</Text>
              )}
            </View>
          </View>
          <View style={[ui.screenPadding]}>
            {isLoadingGoals ? (
              <Text style={styles.loadingText}>Carregando...</Text>
            ) : (
              (Array.isArray(displayGoals) && displayGoals.length > 0) ? (
                displayGoals.slice(0, 3).map((g) => {
                  const id = g._id || g.id;
                  const base = id ? homeGoalBaselines[id] : undefined;
                  let currentVal = g.current || 0;
                  if (base) {
                    if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
                    if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
                    if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
                  }
                  const last = id ? homeGoalLast[id] : undefined;
                  const pct = g.target > 0 ? Math.min(100, Math.round(((currentVal) / g.target) * 100)) : 0;
                  try { if (id) AsyncStorage.setItem(lastKeyFor(id), JSON.stringify(currentVal)); } catch {}
                  return (
                    <View key={g._id} style={[styles.personalGoalCard, ui.card]}>
                      <View style={styles.personalGoalHeader}>
                        <Text style={styles.personalGoalTitle}>{g.title}</Text>
                        <Text style={styles.personalGoalMeta}>{(g.type === 'minutes' ? 'Minutos' : 'Livros')} · {g.period === 'day' ? 'Dia' : g.period === 'week' ? 'Semana' : g.period === 'month' ? 'Mês' : 'Ano'}</Text>
                      </View>
                      <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${pct}%` }]} /></View>
                      <Text style={styles.goalSub}>{currentVal} / {g.target} {g.type === 'minutes' ? 'min' : 'livros'}</Text>
                      {pct >= 100 && (<Text style={styles.goalSub}>Concluída</Text>)}
                      {(g.createdAt && (Date.now() - new Date(g.createdAt).getTime()) < 5 * 60 * 1000) && (<Text style={styles.goalSub}>Meta criada</Text>)}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.loadingText}>Você ainda não tem metas personalizadas</Text>
              )
            )}
          </View>
        </View>

        <View style={ui.section}>
          <View style={[styles.sectionHeader, ui.screenPadding]}>
            <Text style={ui.sectionTitle}>Livros em Destaque</Text>
            <TouchableOpacity onPress={handleSeeAllBooks}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.booksScrollContent, ui.screenPadding]}
          >
            {loadingBooks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Carregando livros...</Text>
              </View>
            ) : 
              featuredBooks.map((book, index) => (
                <TouchableOpacity
                  key={`${book.id}-${index}`}
                  style={styles.bookCard}
                  onPress={() => handleBookPress(book)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bookCardCover}>
                    {book.coverUrl ? (
                      <Image 
                        source={{ uri: book.coverUrl }} 
                        style={styles.bookCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.bookCardCoverPlaceholder}>
                        <Text style={styles.bookCardCoverText}>📚</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.bookCardTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookCardAuthor} numberOfLines={1}>
                    {book.authors?.[0] || 'Autor desconhecido'}
                  </Text>
                  <View style={styles.bookCardRating}>
                    <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
                    <Text style={styles.ratingText}>
                      {book.rating ? book.rating.toFixed(1) : '4.5'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            }
          </ScrollView>
        </View>

        <View style={ui.section}>
          <Text style={[styles.sectionTitle, ui.screenPadding]}>Ações Rápidas</Text>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={[styles.quickActionCard, ui.card]}
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>🏆</Text>
              <Text style={styles.quickActionTitle}>Conquistas</Text>
              <Text style={styles.quickActionSubtitle}>Veja suas conquistas</Text>
            </TouchableOpacity>
            
            
            
            <TouchableOpacity 
              style={[styles.quickActionCard, ui.card]}
              onPress={() => navigation.navigate('Library')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>🔍</Text>
              <Text style={styles.quickActionTitle}>Descobrir</Text>
              <Text style={styles.quickActionSubtitle}>Encontre novos livros</Text>
            </TouchableOpacity>
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
  greetingContainer: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  profileButton: {
    marginLeft: SIZES.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginHorizontal: SIZES.xs,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statNumber: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  statIcon: {
    fontSize: 20,
    marginTop: SIZES.xs,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  continueReadingCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  bookCoverText: {
    fontSize: 24,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  bookAuthor: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.sm,
  },
  continueButtonText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
  },
  booksScrollContent: {
    paddingHorizontal: SIZES.lg,
  },
  bookCard: {
    width: 120,
    marginRight: SIZES.md,
  },
  bookCardCover: {
    width: 120,
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: SIZES.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  bookCardCoverText: {
    fontSize: 40,
  },
  bookCardCoverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    minHeight: 200,
  },
  loadingText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  bookCardTitle: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  bookCardAuthor: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  bookCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 12,
    marginRight: SIZES.xs,
  },
  ratingText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
  },
  personalGoalCard: {
    marginBottom: SIZES.md,
  },
  personalGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  personalGoalTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  personalGoalMeta: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
  },
  goalsCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '31%',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 28,
    marginBottom: SIZES.xs,
  },
  goalTitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  goalValue: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  goalBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginTop: SIZES.xs,
  },
  goalFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  goalSub: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  quickActionCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: SIZES.sm,
  },
  quickActionTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
