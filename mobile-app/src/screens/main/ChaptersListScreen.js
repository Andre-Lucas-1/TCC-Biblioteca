import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, FlatList, Alert } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants';
import api, { chaptersAPI, readingAPI } from '../../services/api';
import ui from '../../theme/ui';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAchievements, fetchAchievements } from '../../store/slices/gamificationSlice';
import { fetchUserStats, incrementBooksRead, fetchGoalsProgress, updateGoalsProgressLocal } from '../../store/slices/userSlice';

const ChaptersListScreen = ({ navigation, route }) => {
  const { bookId, bookTitle } = route.params;
  const dispatch = useDispatch();
  const { stats, goals } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
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
      if (currentProgress && currentProgress.status === 'completed') {
        alert('Você já finalizou este livro.');
        return;
      }
      if (!currentProgress) {
        const startRes = await readingAPI.startReading(bookId);
        currentProgress = startRes.data.progress;
        setProgress(currentProgress);
      }
      try {
        await api.put(`/progress/${currentProgress._id}/status`, { status: 'completed' });
        setProgress({ ...currentProgress, status: 'completed' });
      } catch (_) {
        await api.put(`/progress/${currentProgress._id}/chapter/${lastChapterId}/complete`);
        setProgress({ ...currentProgress, status: 'completed' });
      }
      try {
        const action = await dispatch(checkAchievements());
        const payload = action?.payload || {};
        const newAchievements = Array.isArray(payload.newAchievements) ? payload.newAchievements : [];
        await dispatch(fetchAchievements());
        await dispatch(fetchUserStats());
        try { 
          const beforeWeekly = (stats?.goalsProgress?.weeklyBooks || 0);
          const beforeMonthly = (stats?.goalsProgress?.monthlyBooks || 0);
          const afterWeekly = beforeWeekly + 1;
          const afterMonthly = beforeMonthly + 1;
          dispatch(updateGoalsProgressLocal({ deltaWeeklyBooks: 1, deltaMonthlyBooks: 1 }));
          dispatch(updateCustomGoalsProgressLocal({ weeklyBooks: afterWeekly, monthlyBooks: afterMonthly }));
        } catch {}
        alert('Livro finalizado!');
        try {
          const beforeWeekly = (stats?.goalsProgress?.weeklyBooks || 0);
          const beforeMonthly = (stats?.goalsProgress?.monthlyBooks || 0);
          const afterWeekly = beforeWeekly + 1;
          const afterMonthly = beforeMonthly + 1;
          const weeklyTarget = (stats?.readingGoals?.weekly || 0);
          const monthlyTarget = (stats?.readingGoals?.monthly || 0);
          if (weeklyTarget > 0 && beforeWeekly < weeklyTarget && afterWeekly >= weeklyTarget) {
            Alert.alert('Meta semanal concluída', 'Parabéns!');
          }
          if (monthlyTarget > 0 && beforeMonthly < monthlyTarget && afterMonthly >= monthlyTarget) {
            Alert.alert('Meta mensal concluída', 'Parabéns!');
          }
          const custom = Array.isArray(goals) ? goals : [];
          for (const g of custom) {
            const id = g._id || g.id;
            if (!id) continue;
            if (g.type === 'books' && g.period === 'week') {
              const tgt = g.target || 0;
              const createdAt = g.createdAt ? new Date(g.createdAt) : new Date();
              const now = new Date();
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              const windowStart = new Date(Math.max(startOfWeek.getTime(), createdAt.getTime()));
              // Como não temos contagem exata por meta aqui, usamos afterWeekly como aproximação
              if (tgt > 0 && beforeWeekly < tgt && afterWeekly >= tgt) Alert.alert('Meta concluída', g.title || 'Meta');
            }
            if (g.type === 'books' && g.period === 'month') {
              const tgt = g.target || 0;
              const createdAt = g.createdAt ? new Date(g.createdAt) : new Date();
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const windowStart = new Date(Math.max(startOfMonth.getTime(), createdAt.getTime()));
              if (tgt > 0 && beforeMonthly < tgt && afterMonthly >= tgt) Alert.alert('Meta concluída', g.title || 'Meta');
            }
          }
          try { await dispatch(fetchUserGoals()); } catch {}
          try {
            const updated = {
              message: 'Progresso de metas obtido com sucesso',
              progress: {
                dailyMinutes: stats?.goalsProgress?.dailyMinutes || 0,
                weeklyBooks: afterWeekly,
                monthlyBooks: afterMonthly,
              }
            };
            await AsyncStorage.setItem('cache:/users/goals-progress', JSON.stringify(updated));
          } catch {}
        } catch {}
        if (newAchievements.length > 0) {
          const names = newAchievements.map(a => a.name).filter(Boolean).join(', ');
          alert(names ? `Conquista desbloqueada: ${names}` : 'Conquista desbloqueada!');
        }
      } catch {}
    } catch (e) {
      alert('Falha ao finalizar livro.');
    } finally {
      setFinalizing(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isLast = index === chapters.length - 1;
    const alreadyCompleted = progress && progress.status === 'completed';
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
            <Text style={styles.finalizeText}>{finalizing ? 'Finalizando...' : (alreadyCompleted ? 'Livro já finalizado' : 'Finalizar Livro')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={ui.container}>
      <View style={[styles.header, ui.screenPadding]}>
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
          contentContainerStyle={[styles.list, ui.screenPadding]}
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
