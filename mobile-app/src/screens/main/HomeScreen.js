import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { fetchBooks } from '../../store/slices/booksSlice';

import { Logo } from '../../components';
import externalBooksAPI from '../../services/externalBooksAPI';
const { gutendexAPI, bookUtils } = externalBooksAPI;

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { books, isLoading: booksLoading } = useSelector((state) => state.books);
  
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [continueReading, setContinueReading] = useState(null);

  useEffect(() => {
    // Carregar dados iniciais
    dispatch(fetchBooks({ limit: 5, featured: true }));
    loadFeaturedBooks();
    loadContinueReading();
  }, [dispatch]);

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

  const loadContinueReading = async () => {
    // Simular um livro sendo lido (em uma implementação real, viria do backend)
    const mockContinueReading = {
      id: 'continue-1',
      title: 'Dom Casmurro',
      authors: ['Machado de Assis'],
      progress: 65,
      coverUrl: 'https://via.placeholder.com/120x180/7D4105/FFFFFF?text=Dom+Casmurro'
    };
    setContinueReading(mockContinueReading);
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
    <SafeAreaView style={styles.container}>
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
        
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.userName}>{user?.name || 'Leitor'}! 👋</Text>
        </View>

        {/* Stats removidos conforme solicitação */}

        {/* Continue Reading Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Lendo</Text>
          </View>
          
          <View style={styles.continueReadingCard}>
            <View style={styles.bookCover}>
              <Text style={styles.bookCoverText}>📖</Text>
            </View>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>O Último Desejo</Text>
              <Text style={styles.bookAuthor}>Andrzej Sapkowski</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '65%' }]} />
                </View>
                <Text style={styles.progressText}>65%</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Livros em Destaque</Text>
            <TouchableOpacity onPress={handleSeeAllBooks}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksScrollContent}
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Achievements')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>🏆</Text>
              <Text style={styles.quickActionTitle}>Conquistas</Text>
              <Text style={styles.quickActionSubtitle}>Veja suas conquistas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Statistics')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionTitle}>Estatísticas</Text>
              <Text style={styles.quickActionSubtitle}>Acompanhe seu progresso</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
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
