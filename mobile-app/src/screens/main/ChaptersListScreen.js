import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, FlatList } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import { chaptersAPI } from '../../services/api';

const ChaptersListScreen = ({ navigation, route }) => {
  const { bookId, bookTitle } = route.params;
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await chaptersAPI.getChapters(bookId);
        setChapters(res.data.chapters || []);
      } catch (e) {
        setError('Erro ao carregar capítulos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('ReadingScreen', { bookId, chapterId: item._id, chapterTitle: item.title })}
    >
      <Text style={styles.itemTitle}>{item.chapterNumber}. {item.title}</Text>
      <Text style={styles.itemMeta}>~{item.estimatedReadingTime} min • {item.wordCount} palavras</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{bookTitle || 'Capítulos'}</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.lg, backgroundColor: COLORS.white },
  backIcon: { fontSize: 24, color: COLORS.text, fontWeight: FONTS.weights.bold },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: SIZES.fontSize.lg, fontWeight: FONTS.weights.bold, color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: COLORS.error || '#B00020' },
  list: { padding: SIZES.lg },
  item: { backgroundColor: COLORS.white, padding: SIZES.md, marginBottom: SIZES.sm, borderRadius: SIZES.radius.md },
  itemTitle: { fontSize: SIZES.fontSize.md, fontWeight: FONTS.weights.semiBold, color: COLORS.text },
  itemMeta: { fontSize: SIZES.fontSize.sm, color: COLORS.textSecondary, marginTop: SIZES.xs },
});

export default ChaptersListScreen;
