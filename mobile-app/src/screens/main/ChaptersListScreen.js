import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, FlatList } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import api, { chaptersAPI, readingAPI } from '../../services/api';
import { useDispatch } from 'react-redux';
import { checkAchievements } from '../../store/slices/gamificationSlice';

const ChaptersListScreen = ({ navigation, route }) => {
  const { bookId, bookTitle } = route.params;
  const dispatch = useDispatch();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await chaptersAPI.getChapters(bookId);
        setChapters(res.data.chapters || []);
        try {
          const pRes = await readingAPI.getBookProgress(bookId);
          setProgress(pRes.data.progress || null);
        } catch {}
      } catch (e) {
        setError('Erro ao carregar capítulos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookId]);

  const finalizeBook = async (lastChapterId) => {
    try {
      setFinalizing(true);
      let currentProgress = progress;
      if (!currentProgress) {
        const startRes = await readingAPI.startReading(bookId);
        currentProgress = startRes.data.progress;
        setProgress(currentProgress);
      }
      try {
        await api.put(`/progress/${currentProgress._id}/status`, { status: 'completed' });
      } catch (_) {
        await api.put(`/progress/${currentProgress._id}/chapter/${lastChapterId}/complete`);
      }
      try {
        await dispatch(checkAchievements());
        // Garantir sincronização com o servidor
        await dispatch(fetchAchievements());
      } catch {}
      alert('Livro finalizado! Conquista aplicada.');
    } catch (e) {
      alert('Falha ao finalizar livro.');
    } finally {
      setFinalizing(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isLast = index === chapters.length - 1;
    return (
      <View style={styles.item}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ReadingScreen', { bookId, chapterId: item._id, chapterTitle: item.title })}
        >
          <Text style={styles.itemTitle}>{item.chapterNumber}. {item.title}</Text>
          <Text style={styles.itemMeta}>~{item.estimatedReadingTime} min • {item.wordCount} palavras</Text>
        </TouchableOpacity>
        {isLast && (
          <TouchableOpacity
            style={[styles.finalizeBtn, finalizing && { opacity: 0.6 }]}
            disabled={finalizing}
            onPress={() => finalizeBook(item._id)}
          >
            <Text style={styles.finalizeText}>{finalizing ? 'Finalizando...' : 'Finalizar Livro'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
  finalizeBtn: { marginTop: SIZES.sm, backgroundColor: COLORS.primary, paddingVertical: SIZES.sm, borderRadius: SIZES.radius.sm, alignItems: 'center' },
  finalizeText: { color: COLORS.white, fontWeight: FONTS.weights.semiBold }
});

export default ChaptersListScreen;
