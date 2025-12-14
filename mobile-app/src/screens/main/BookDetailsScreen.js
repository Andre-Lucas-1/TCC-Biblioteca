import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import externalBooksAPI from '../../services/externalBooksAPI';
const { gutendexAPI, bookUtils } = externalBooksAPI;
import { apiUtils } from '../../services/api';
import { addBookToLibrary } from '../../store/slices/booksSlice';
import { startReading } from '../../store/slices/readingSlice';
import { chaptersAPI } from '../../services/api';

const BookDetailsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToLibrary, setAddingToLibrary] = useState(false);
  const { books } = useSelector((state) => state.books);

  useEffect(() => {
    loadBookDetails();
  }, [bookId]);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      
      const result = await gutendexAPI.details(bookId);
      const bookData = bookUtils.formatBookData(result.book);
      setBook(bookData);
    } catch (error) {
      console.error('Erro ao carregar detalhes do livro:', error);
      Alert.alert('Erro', 'Erro ao carregar os detalhes do livro.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!book) return;

    try {
      setAddingToLibrary(true);

      // Verifica se já está na biblioteca pelo externalId/título/ISBN
      const existing = books.find(
        (b) => b.externalId === book.id || b.title === book.title || (book.isbn && b.isbn === book.isbn)
      );
      let targetId = existing?._id || existing?.id;
      if (!targetId) {
        const result = await gutendexAPI.import(book.id);
        const added = result?.book;
        targetId = added?._id;
        if (!targetId) {
          Alert.alert('Erro', 'Falha ao importar livro');
          return;
        }
      }

      try { await dispatch(startReading(targetId)); } catch {}
      

      navigation.navigate('MainTabs', { screen: 'Reading' });
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message;
      if (status === 401) {
        try { await apiUtils.logout(); } catch {}
        Alert.alert('Sessão expirada', 'Faça login para adicionar livros à sua biblioteca.');
        return;
      }
      if (status === 404) {
        Alert.alert('Livro não encontrado', msg || 'ID inválido na Gutendex');
      } else if (status === 422) {
        Alert.alert('Importação indisponível', msg || 'Este livro não possui versão texto (.txt).');
      } else if (status === 502) {
        Alert.alert('Falha de download', msg || 'Não foi possível baixar o conteúdo do livro.');
      } else {
        Alert.alert('Erro', 'Não foi possível adicionar o livro à biblioteca.');
      }
    } finally {
      setAddingToLibrary(false);
    }
  };

  const handleStartReading = async () => {
    try {
      setAddingToLibrary(true);
      const existing = books.find(
        (b) => b.externalId === book.id || b.title === book.title || (book.isbn && b.isbn === book.isbn)
      );
      let targetId = existing?._id || existing?.id;
      if (!targetId) {
        const result = await gutendexAPI.import(book.id);
        const added = result?.book;
        targetId = added?._id;
      }
      if (!targetId) {
        Alert.alert('Erro', 'Falha ao iniciar leitura');
        return;
      }
      const chaptersRes = await chaptersAPI.getChapters(targetId);
      const chapters = chaptersRes.data?.chapters || [];
      const first = chapters[0];
      if (first?._id) {
        navigation.navigate('ReadingScreen', { bookId: targetId, chapterId: first._id, bookTitle: book.title });
      } else {
        Alert.alert('Capítulos indisponíveis', 'Não há capítulos disponíveis para leitura');
      }
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message;
      if (status === 401) {
        try { await apiUtils.logout(); } catch {}
        Alert.alert('Sessão expirada', 'Faça login para iniciar a leitura e salvar progresso.');
        return;
      }
      if (status === 404) {
        Alert.alert('Livro não encontrado', msg || 'ID inválido na Gutendex');
      } else if (status === 422) {
        Alert.alert('Importação indisponível', msg || 'Este livro não possui versão texto (.txt).');
      } else if (status === 502) {
        Alert.alert('Falha de download', msg || 'Não foi possível baixar o conteúdo do livro.');
      } else {
        Alert.alert('Erro', 'Não foi possível iniciar a leitura.');
      }
    } finally {
      setAddingToLibrary(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Livro não encontrado</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Livro</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Book Cover and Basic Info */}
        <View style={styles.bookHeader}>
          <View style={styles.bookCover}>
            {book.coverUrl ? (
              <Image 
                source={{ uri: book.coverUrl }} 
                style={styles.bookCoverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookCoverPlaceholder}>
                <Text style={styles.bookCoverText}>📚</Text>
              </View>
            )}
          </View>
          
          <View style={styles.bookBasicInfo}>
            <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">{book.title}</Text>
            <Text style={styles.bookAuthor} numberOfLines={1} ellipsizeMode="tail">
              {book.authors?.join(', ') || book.author || 'Autor desconhecido'}
            </Text>
            <Text style={styles.bookGenre} numberOfLines={1} ellipsizeMode="tail">
              {book.subjects?.[0] || book.genre || 'Gênero não especificado'}
            </Text>
            
            <View style={styles.bookMeta}>
              {book.publishedDate && (
                <Text style={styles.metaText}>📅 {book.publishedDate}</Text>
              )}
              {book.pageCount && (
                <Text style={styles.metaText}>📄 {book.pageCount} páginas</Text>
              )}
              {book.language && (
                <Text style={styles.metaText}>🌐 {book.language.toUpperCase()}</Text>
              )}
            </View>
            
            <View style={styles.rating}>
              <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.ratingText}>
                {book.rating ? book.rating.toFixed(1) : '4.5'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Adicionais</Text>
          
          {book.isbn && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} numberOfLines={1}>ISBN:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{book.isbn}</Text>
            </View>
          )}
          
          {book.subjects && book.subjects.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} numberOfLines={1}>Categorias:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{book.subjects.slice(0, 3).join(', ')}</Text>
            </View>
          )}
          
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} numberOfLines={1}>Fonte:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                {book.source === 'openLibrary' ? 'Open Library' : 
                 book.source === 'googleBooks' ? 'Google Books' : 'Externa'}
              </Text>
            </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.addToLibraryButton]}
          onPress={handleAddToLibrary}
          disabled={addingToLibrary}
        >
          {addingToLibrary ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.actionButtonIcon}>📚</Text>
              <Text style={styles.actionButtonText}>Adicionar à Biblioteca</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.startReadingButton]}
          onPress={handleStartReading}
        >
          <Text style={styles.actionButtonIcon}>📖</Text>
          <Text style={styles.actionButtonText}>Começar a Ler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.viewChaptersButton]}
          onPress={async () => {
            try {
              setAddingToLibrary(true);
              const existing = books.find(
                (b) => b.externalId === book.id || b.title === book.title || (book.isbn && b.isbn === book.isbn)
              );
              let targetId = existing?._id || existing?.id;
              if (!targetId) {
                const result = await gutendexAPI.import(book.id);
                const added = result?.book;
                targetId = added?._id;
              }
              if (targetId) {
                navigation.navigate('ChaptersList', { bookId: targetId, bookTitle: book.title });
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível abrir os capítulos.');
            } finally {
              setAddingToLibrary(false);
            }
          }}
        >
          <Text style={styles.actionButtonIcon}>📑</Text>
          <Text style={[styles.actionButtonText, styles.viewChaptersText]}>Ver Capítulos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backButton: {
    padding: SIZES.sm,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: FONTS.weights.bold,
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
  },
  errorText: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  bookHeader: {
    flexDirection: 'row',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.white,
    marginBottom: SIZES.md,
  },
  bookCover: {
    width: 120,
    height: 160,
    marginRight: SIZES.lg,
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.md,
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverText: {
    fontSize: 48,
  },
  bookBasicInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    lineHeight: 22,
  },
  bookGenre: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    marginBottom: SIZES.md,
  },
  bookMeta: {
    marginBottom: SIZES.md,
  },
  metaText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 16,
    marginRight: SIZES.sm,
  },
  ratingText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  section: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  description: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  infoLabel: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    marginHorizontal: SIZES.xs,
    ...SHADOWS.light,
  },
  addToLibraryButton: {
    backgroundColor: COLORS.secondary,
  },
  startReadingButton: {
    backgroundColor: COLORS.primary,
  },
  viewChaptersButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: SIZES.sm,
  },
  actionButtonText: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.white,
  },
  viewChaptersText: {
    color: COLORS.primary,
  },
});

export default BookDetailsScreen;
