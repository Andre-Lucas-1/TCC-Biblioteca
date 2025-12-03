import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS, BOOK_GENRES } from '../../constants';
import { fetchBooks, clearFilters } from '../../store/slices/booksSlice';
import { Logo } from '../../components';
import externalBooksAPI from '../../services/externalBooksAPI';
const { gutendexAPI, bookUtils } = externalBooksAPI;

const LibraryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { books, isLoading, filters } = useSelector((state) => state.books);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [viewMode, setViewMode] = useState('library');
  const [filteredLibrary, setFilteredLibrary] = useState([]);
  const [explorePage, setExplorePage] = useState(1);
  const [exploreHasNext, setExploreHasNext] = useState(true);

  useEffect(() => {
    // Carregar livros iniciais
    dispatch(fetchBooks({ limit: 20 }));
    loadInitialBooks();
  }, [dispatch]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      const q = searchQuery.trim();
      if (viewMode === 'explore') {
        if (q || selectedGenre) performSearch(q, selectedGenre);
        else loadInitialBooks();
      } else {
        filterLibrary(q, selectedGenre, selectedStatus);
      }
    }, 400);
    setSearchTimeout(timeout);
    return () => { if (timeout) clearTimeout(timeout); };
  }, [searchQuery, viewMode]);

  useEffect(() => {
    if (viewMode === 'explore') {
      const q = searchQuery.trim();
      performSearch(q, selectedGenre);
    } else {
      const q = searchQuery.trim();
      filterLibrary(q, selectedGenre, selectedStatus);
    }
  }, [selectedGenre, selectedStatus, books, viewMode]);

  const loadInitialBooks = async () => {
    try {
      const result = await gutendexAPI.search('', 1);
      const formattedBooks = (result.books || []).map(book => bookUtils.formatBookData(book));
      setSearchResults(formattedBooks);
      setExplorePage(result.pagination?.page || 1);
      setExploreHasNext(!!result.pagination?.hasNext);
    } catch (error) {
      console.error('Erro ao carregar livros iniciais:', error);
    }
  };

  const performSearch = async (query, genreId) => {
    try {
      setLoadingSearch(true);
      const term = genreId ? `${query} ${BOOK_GENRES.find(g => g.id === genreId)?.name || ''}`.trim() : query;
      const result = await gutendexAPI.search(term, 1);
      const formattedBooks = (result.books || []).map(book => bookUtils.formatBookData(book));
      setSearchResults(formattedBooks);
      setExplorePage(result.pagination?.page || 1);
      setExploreHasNext(!!result.pagination?.hasNext);
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const filterLibrary = (query, genreId, statusKey) => {
    let list = books || [];
    if (genreId) {
      const gName = BOOK_GENRES.find(g => g.id === genreId)?.name?.toLowerCase();
      list = list.filter(b => (b.genre || '').toLowerCase().includes(gName || ''));
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(b => (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q));
    }
    setFilteredLibrary(list);
  };

  const handleBookPress = (book) => {
    navigation.navigate('BookDetails', { bookId: book.id });
  };

  const handleMyBookPress = (book) => {
    navigation.navigate('ChaptersList', { bookId: book._id, bookTitle: book.title });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedStatus('all');
    setSearchResults([]);
    loadInitialBooks();
    dispatch(clearFilters());
    dispatch(fetchBooks({ limit: 20 }));
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookCover}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.bookCoverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bookCoverPlaceholder}>
            <Text style={styles.bookCoverText}>📖</Text>
          </View>
        )}
      </View>
      
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title || 'Título não disponível'}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.authors?.join(', ') || item.author || 'Autor desconhecido'}
        </Text>
        <Text style={styles.bookGenre}>
          {item.subjects?.[0] || item.genre || 'Gênero não especificado'}
        </Text>
        
        <View style={styles.bookMeta}>
          <View style={styles.rating}>
            <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.ratingText}>4.{item.id}</Text>
          </View>
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Disponível</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.favoriteButton}>
        <Text style={styles.favoriteIcon}>🤍</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMyBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => handleMyBookPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookCover}>
        {item.coverImage ? (
          <Image
            source={{ uri: item.coverImage }}
            style={styles.bookCoverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bookCoverPlaceholder}>
            <Text style={styles.bookCoverText}>📖</Text>
          </View>
        )}
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author || 'Autor desconhecido'}
        </Text>
        <Text style={styles.bookGenre}>
          {item.genre || 'Gênero não especificado'}
        </Text>
        <View style={styles.bookMeta}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Na biblioteca</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.favoriteButton}>
        <Text style={styles.favoriteIcon}>🤍</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderGenreFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.genreChip,
        selectedGenre === item.id && styles.genreChipSelected,
      ]}
      onPress={() => setSelectedGenre(selectedGenre === item.id ? '' : item.id)}
    >
      <Text
        style={[
          styles.genreChipText,
          selectedGenre === item.id && styles.genreChipTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const statusOptions = [
    { key: 'all', label: 'Todos' },
    { key: 'available', label: 'Disponível' },
    { key: 'reading', label: 'Lendo' },
    { key: 'completed', label: 'Concluído' },
    { key: 'wishlist', label: 'Lista de Desejos' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <Logo.Header
        rightComponent={
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Limpar</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={viewMode === 'library' ? 'Buscar na biblioteca...' : 'Buscar livros, autores...'}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilterContent}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.statusChip,
                selectedStatus === option.key && styles.statusChipSelected,
              ]}
              onPress={() => setSelectedStatus(option.key)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  selectedStatus === option.key && styles.statusChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Genre Filter */}
      <View style={styles.genreFilterContainer}>
        <Text style={styles.filterTitle}>Gêneros</Text>
        <FlatList
          data={BOOK_GENRES}
          renderItem={renderGenreFilter}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreFilterContent}
        />
      </View>

      {/* Switch Library/Explore */}
      <View style={styles.viewSwitchContainer}>
        <View style={styles.viewSwitch}>
          <TouchableOpacity
            style={[styles.viewSwitchBtn, viewMode === 'library' && styles.viewSwitchBtnActive]}
            onPress={() => setViewMode('library')}
          >
            <Text style={[styles.viewSwitchText, viewMode === 'library' && styles.viewSwitchTextActive]}>Minha Biblioteca</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewSwitchBtn, viewMode === 'explore' && styles.viewSwitchBtnActive]}
            onPress={() => setViewMode('explore')}
          >
            <Text style={[styles.viewSwitchText, viewMode === 'explore' && styles.viewSwitchTextActive]}>Explorar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Books List */}
      <View style={styles.booksContainer}>
        {viewMode === 'library' ? (
          <>
            <View style={styles.booksHeader}>
              <Text style={styles.booksCount}>{filteredLibrary?.length || books?.length || 0} na biblioteca</Text>
            </View>
            <FlatList
              data={filteredLibrary.length ? filteredLibrary : books}
              renderItem={renderMyBookItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.booksListContent}
              ItemSeparatorComponent={() => <View style={styles.bookSeparator} />}
              refreshing={isLoading}
              onRefresh={() => dispatch(fetchBooks({ limit: 20 }))}
              ListEmptyComponent={() => (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Nenhum livro na biblioteca ainda</Text>
                </View>
              )}
            />
          </>
        ) : (
          <>
            <View style={styles.booksHeader}>
              <Text style={styles.booksCount}>{searchResults?.length || 0} livros encontrados</Text>
              <TouchableOpacity style={styles.sortButton}>
                <Text style={styles.sortIcon}>⚡</Text>
                <Text style={styles.sortText}>Ordenar</Text>
              </TouchableOpacity>
            </View>
            {loadingSearch ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Buscando livros...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderBookItem}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.booksListContent}
                ItemSeparatorComponent={() => <View style={styles.bookSeparator} />}
                refreshing={isLoading}
                onRefresh={() => dispatch(fetchBooks({ limit: 20 }))}
                onEndReachedThreshold={0.5}
                onEndReached={loadMoreExplore}
              />
            )}
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  headerTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  clearFiltersText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  searchContainer: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    ...SHADOWS.light,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    paddingVertical: SIZES.md,
  },
  statusFilterContainer: {
    marginBottom: SIZES.md,
  },
  statusFilterContent: {
    paddingHorizontal: SIZES.lg,
  },
  statusChip: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.full,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    ...SHADOWS.light,
  },
  statusChipSelected: {
    backgroundColor: COLORS.primary,
  },
  statusChipText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  statusChipTextSelected: {
    color: COLORS.white,
  },
  genreFilterContainer: {
    marginBottom: SIZES.lg,
  },
  filterTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  genreFilterContent: {
    paddingHorizontal: SIZES.lg,
  },
  genreChip: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    marginRight: SIZES.sm,
  },
  genreChipSelected: {
    backgroundColor: COLORS.secondary,
  },
  genreChipText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  genreChipTextSelected: {
    color: COLORS.white,
  },
  booksContainer: {
    flex: 1,
  },
  booksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  booksCount: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    fontSize: 16,
    marginRight: SIZES.xs,
  },
  sortText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  booksListContent: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  bookSeparator: {
    height: SIZES.md,
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  bookCoverText: {
    fontSize: 24,
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.sm,
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  loadingText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
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
    marginBottom: SIZES.xs,
  },
  bookGenre: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 12,
    marginRight: SIZES.xs,
  },
  ratingText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  statusBadge: {
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
  },
  statusText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
  },
  favoriteButton: {
    padding: SIZES.sm,
  },
  favoriteIcon: {
    fontSize: 20,
  },
});

export default LibraryScreen;
  const loadMoreExplore = async () => {
    if (!exploreHasNext || loadingSearch || viewMode !== 'explore') return;
    try {
      setLoadingSearch(true);
      const term = selectedGenre ? `${searchQuery.trim()} ${BOOK_GENRES.find(g => g.id === selectedGenre)?.name || ''}`.trim() : searchQuery.trim();
      const nextPage = explorePage + 1;
      const result = await gutendexAPI.search(term, nextPage);
      const formattedBooks = (result.books || []).map(book => bookUtils.formatBookData(book));
      setSearchResults(prev => [...prev, ...formattedBooks]);
      setExplorePage(result.pagination?.page || nextPage);
      setExploreHasNext(!!result.pagination?.hasNext);
    } catch (error) {
      console.error('Erro ao carregar mais livros:', error);
    } finally {
      setLoadingSearch(false);
    }
  };
