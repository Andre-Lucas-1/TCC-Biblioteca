import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReadingProgress } from '../store/slices/readingSlice';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabBarIcon = ({ focused, icon, label }) => {
  return (
    <View style={styles.tabIconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.iconWrapperFocused
      ]}>
        <Text style={[
          styles.iconText,
          { color: focused ? COLORS.white : COLORS.textSecondary }
        ]}>
          {icon}
        </Text>
      </View>
      <Text style={[
        styles.labelText,
        { color: focused ? COLORS.primary : COLORS.textSecondary }
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Reading tab: shows books em leitura
const ReadingTabScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const readingState = useSelector((state) => state.reading);
  const { overallProgress, isLoading } = readingState;
  const booksInProgress = Array.isArray(overallProgress?.booksInProgress) ? overallProgress.booksInProgress : [];

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchReadingProgress());
    }, [dispatch])
  );

  const renderItem = ({ item }) => {
    const bookId = item?.book?._id || item?.bookId || item?.id;
    const title = item?.book?.title || item?.title || 'Livro';
    const author = (item?.book?.author || item?.author || '') + '';
    const cover = item?.book?.coverImage || item?.coverImage || '';
    return (
      <View style={styles.readingCard}>
        <View style={styles.readingCover}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.readingCoverImage} resizeMode="cover" />
          ) : (
            <View style={styles.readingCoverPlaceholder}><Text style={styles.readingCoverIcon}>📚</Text></View>
          )}
        </View>
        <View style={styles.readingInfo}>
          <Text style={styles.readingTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          {!!author && <Text style={styles.readingAuthor} numberOfLines={1} ellipsizeMode="tail">{author}</Text>}
          <View style={styles.readingActions}>
            <TouchableOpacity style={styles.readingButton} onPress={() => navigation.navigate('ChaptersList', { bookId, bookTitle: title })}>
              <Text style={styles.readingButtonText}>Ver capítulos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && booksInProgress.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📖</Text>
        <Text style={styles.placeholderTitle}>Leitura</Text>
        <Text style={styles.placeholderText}>Carregando seus livros...</Text>
      </View>
    );
  }

  if (booksInProgress.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📖</Text>
        <Text style={styles.placeholderTitle}>Leitura</Text>
        <Text style={styles.placeholderText}>Nenhum livro em leitura. Adicione um pela Biblioteca.</Text>
      </View>
    );
  }

  return (
    <View style={styles.readingListContainer}>
      <FlatList
        data={booksInProgress}
        keyExtractor={(item, idx) => (item?.book?._id || item?.bookId || item?.id || idx.toString())}
        renderItem={renderItem}
        contentContainerStyle={styles.readingListContent}
      />
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              icon="🏠"
              label="Início"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              icon="📚"
              label="Biblioteca"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Reading"
        component={ReadingTabScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              icon="📖"
              label="Leitura"
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              icon="👤"
              label="Perfil"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    height: 80,
    paddingBottom: SIZES.sm,
    paddingTop: SIZES.sm,
    ...SHADOWS.medium,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
    ...SHADOWS.light,
  },
  iconWrapperFocused: {
    backgroundColor: COLORS.primary,
  },
  iconText: {
    fontSize: 22,
  },
  labelText: {
    fontSize: SIZES.fontSize.xs,
    fontWeight: FONTS.weights.medium,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SIZES.lg,
  },
  placeholderTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  readingListContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: SIZES.md,
  },
  readingListContent: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  readingCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  readingCover: {
    width: 60,
    height: 80,
    marginRight: SIZES.md,
  },
  readingCoverImage: { width: '100%', height: '100%', borderRadius: SIZES.radius.sm },
  readingCoverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.radius.sm },
  readingCoverIcon: { fontSize: 24 },
  readingInfo: { flex: 1 },
  readingTitle: { fontSize: SIZES.fontSize.md, fontWeight: FONTS.weights.semiBold, color: COLORS.text },
  readingAuthor: { fontSize: SIZES.fontSize.sm, color: COLORS.textSecondary, marginTop: SIZES.xs },
  readingActions: { flexDirection: 'row', marginTop: SIZES.sm },
  readingButton: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius.sm, paddingVertical: SIZES.xs, paddingHorizontal: SIZES.md },
  readingButtonText: { color: COLORS.white, fontWeight: FONTS.weights.medium, fontSize: SIZES.fontSize.sm },
});

export default MainTabNavigator;
