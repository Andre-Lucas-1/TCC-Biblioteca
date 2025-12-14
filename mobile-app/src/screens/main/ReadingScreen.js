import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { fetchBookProgress, startReading } from '../../store/slices/readingSlice';
import { chaptersAPI } from '../../services/api';
import api, { readingAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAchievements, fetchAchievements } from '../../store/slices/gamificationSlice';
import { fetchUserStats, updateGoalsProgressLocal, incrementGoalProgressLocal, fetchUserGoals } from '../../store/slices/userSlice';
import { CommonActions } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const ReadingScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { bookId, chapterId } = route.params || {};
  const readingState = useSelector((state) => state.reading);
  const { stats, goals } = useSelector((state) => state.user);
  const progressByBook = readingState.bookProgress?.[bookId];
  const { isLoading, newAchievements } = readingState;

  const [fontSize, setFontSize] = useState(16);
  const [backgroundColor, setBackgroundColor] = useState(COLORS.white);
  const [textColor, setTextColor] = useState(COLORS.text);
  const [showSettings, setShowSettings] = useState(false);
  const [chapter, setChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readingTime, setReadingTime] = useState(0);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isLastChapter, setIsLastChapter] = useState(false);

  useEffect(() => {
    if (bookId) {
      dispatch(startReading(bookId));
      dispatch(fetchBookProgress(bookId));
    }
    const load = async () => {
      if (chapterId) {
        try {
          const res = await chaptersAPI.getChapter(chapterId, currentPage, 600);
          setChapter(res.data.chapter);
          setTotalPages(res.data.chapter?.pagination?.totalPages || 1);
        } catch (e) {}
      }
    };
    load();
    const timer = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);
    return () => { clearInterval(timer); };
  }, [bookId, chapterId, dispatch]);

  const goToChapter = async (targetId) => {
    if (!targetId) return;
    try { await chaptersAPI.markRead(chapterId); } catch {}
    navigation.replace('ReadingScreen', { bookId, chapterId: targetId });
  };

  const resolveNextChapterId = async () => {
    if (chapter?.navigation?.next && (chapter.navigation.next._id || chapter.navigation.next.id)) {
      return chapter.navigation.next._id || chapter.navigation.next.id;
    }
    try {
      const res = await chaptersAPI.getChapters(bookId);
      const list = res.data?.chapters || [];
      const currentOrder = chapter?.order ?? chapter?.chapterNumber;
      // try by order, fallback to chapterNumber
      let idx = -1;
      if (currentOrder != null) {
        idx = list.findIndex(c => (c.order ?? c.chapterNumber) === currentOrder);
      } else {
        idx = list.findIndex(c => c._id === chapterId);
      }
      const next = idx >= 0 ? list[idx + 1] : null;
      return next?._id || next?.id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const checkLastChapter = async () => {
      try {
        const res = await chaptersAPI.getChapters(bookId);
        const list = res.data?.chapters || [];
        const currentId = chapter?._id || chapterId;
        let idx = list.findIndex(c => c._id === currentId);
        if (idx < 0) {
          const currentOrder = chapter?.order ?? chapter?.chapterNumber;
          if (currentOrder != null) idx = list.findIndex(c => (c.order ?? c.chapterNumber) === currentOrder);
        }
        setIsLastChapter(idx >= 0 && idx === list.length - 1);
      } catch {
        setIsLastChapter(false);
      }
    };
    checkLastChapter();
  }, [bookId, chapterId, chapter]);

  const finalizeBook = async () => {
    try {
      setFinalizing(true);
      let pRes;
      try { pRes = await readingAPI.getBookProgress(bookId); } catch {}
      let currentProgress = pRes?.data?.progress || null;
      if (currentProgress && currentProgress.status === 'completed') {
        Alert.alert('Livro já finalizado');
        setFinalizing(false);
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }] }));
        return;
      }
      if (!currentProgress) {
        try { const startRes = await readingAPI.startReading(bookId); currentProgress = startRes?.data?.progress; } catch {}
      }
      if (!currentProgress) { setFinalizing(false); return; }
      try {
        await api.put(`/progress/${currentProgress._id}/status`, { status: 'completed' });
      } catch (_) {
        try { await api.put(`/progress/${currentProgress._id}/chapter/${chapterId}/complete`); } catch {}
      }
      try {
        const action = await dispatch(checkAchievements());
        const payload = action?.payload || {};
        const unlocked = Array.isArray(payload.newAchievements) ? payload.newAchievements : [];
        if (unlocked.length > 0) {
          const names = unlocked.map(a => a?.name).filter(Boolean).join(', ');
          Alert.alert('Conquista concluída', names || 'Nova conquista');
          setShowAchievementModal(true);
        }
        await dispatch(fetchAchievements());
        await dispatch(fetchUserStats());
        const beforeWeekly = (stats?.goalsProgress?.weeklyBooks || 0);
        const beforeMonthly = (stats?.goalsProgress?.monthlyBooks || 0);
        const afterWeekly = beforeWeekly + 1;
        const afterMonthly = beforeMonthly + 1;
        dispatch(updateGoalsProgressLocal({ deltaWeeklyBooks: 1, deltaMonthlyBooks: 1 }));
        dispatch(incrementGoalProgressLocal({ type: 'books', period: 'week', delta: 1 }));
        dispatch(incrementGoalProgressLocal({ type: 'books', period: 'month', delta: 1 }));
        Alert.alert('Livro finalizado!');
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
          const id = g._id || g.id; if (!id) continue;
          if (g.type === 'books' && g.period === 'week') {
            const tgt = g.target || 0;
            if (tgt > 0 && beforeWeekly < tgt && afterWeekly >= tgt) Alert.alert('Meta concluída', g.title || 'Meta');
          }
          if (g.type === 'books' && g.period === 'month') {
            const tgt = g.target || 0;
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
        const authUser = (await AsyncStorage.getItem('userData'));
        let uid = 'anonymous';
        try { if (authUser) { const u = JSON.parse(authUser); uid = u?._id || u?.id || u?.userId || uid; } } catch {}
        await AsyncStorage.setItem(`cache:/users/${uid}/goals-progress`, JSON.stringify(updated));
      } catch {}
      } catch {}
    } catch {}
    finally {
      setFinalizing(false);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Home' }] } }] }));
    }
  };

  const goToPage = async (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    try {
      const res = await chaptersAPI.getChapter(chapterId, nextPage, 600);
      setChapter(res.data.chapter);
      setCurrentPage(nextPage);
      setTotalPages(res.data.chapter?.pagination?.totalPages || totalPages);
    } catch {}
  };

  const handleFontSizeChange = (change) => {
    const newSize = fontSize + change;
    if (newSize >= 12 && newSize <= 24) {
      setFontSize(newSize);
    }
  };

  const themeOptions = [
    { name: 'Claro', bg: COLORS.white, text: COLORS.text },
    { name: 'Sépia', bg: '#F4F1E8', text: '#5D4E37' },
    { name: 'Escuro', bg: '#1A1A1A', text: '#E0E0E0' },
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar 
        barStyle={backgroundColor === COLORS.white ? 'dark-content' : 'light-content'} 
        backgroundColor={backgroundColor} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.chapterTitle, { color: textColor }]}>{chapter?.title || 'Capítulo'}</Text>
          <Text style={[styles.readingTime, { color: textColor }]}>
            {formatTime(readingTime)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={[styles.headerButtonText, { color: textColor }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      

      {/* Content */}
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.content, { fontSize, color: textColor }]}>
          {chapter?.content || ''}
        </Text>
      </ScrollView>

      <View style={[styles.navigation, { backgroundColor }]}> 
        <TouchableOpacity 
          style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={[styles.navButtonText, { color: textColor }]}>‹ Página</Text>
        </TouchableOpacity>
        <Text style={[styles.navButtonText, { color: textColor }]}>Página {currentPage} / {totalPages}</Text>
        <TouchableOpacity 
          style={[styles.navButton, currentPage === totalPages && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.navButtonText, { color: textColor }]}>Página ›</Text>
        </TouchableOpacity>
      </View>

      {(((chapter?.pagination?.page ?? currentPage) >= (chapter?.pagination?.totalPages ?? totalPages))) ? (
        <View style={[styles.navigation, { backgroundColor }]}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={async () => { const nextId = await resolveNextChapterId(); if (nextId) goToChapter(nextId); }}
          >
            <Text style={[styles.navButtonText, { color: textColor }]}>Próximo capítulo ›</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {(((chapter?.pagination?.page ?? currentPage) >= (chapter?.pagination?.totalPages ?? totalPages)) && isLastChapter) ? (
        <View style={[styles.navigation, { backgroundColor }]}>
          <TouchableOpacity 
            style={[styles.finishButton, finalizing && { opacity: 0.6 }]}
            onPress={finalizing ? undefined : finalizeBook}
            disabled={finalizing}
          >
            <Text style={styles.finishButtonText}>{finalizing ? 'Finalizando...' : 'Finalizar Livro'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações de Leitura</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Font Size */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Tamanho da Fonte</Text>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity 
                  style={styles.fontButton}
                  onPress={() => handleFontSizeChange(-2)}
                >
                  <Text style={styles.fontButtonText}>A-</Text>
                </TouchableOpacity>
                <Text style={styles.fontSizeDisplay}>{fontSize}px</Text>
                <TouchableOpacity 
                  style={styles.fontButton}
                  onPress={() => handleFontSizeChange(2)}
                >
                  <Text style={styles.fontButtonText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Theme */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Tema</Text>
              <View style={styles.themeOptions}>
                {themeOptions.map((theme, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.themeOption,
                      { backgroundColor: theme.bg },
                      backgroundColor === theme.bg && styles.themeOptionSelected,
                    ]}
                    onPress={() => {
                      setBackgroundColor(theme.bg);
                      setTextColor(theme.text);
                    }}
                  >
                    <Text style={[styles.themeOptionText, { color: theme.text }]}>
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievement Modal */}
      <Modal
        visible={showAchievementModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAchievementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.achievementModal}>
            <Text style={styles.achievementTitle}>🎉 Conquista Desbloqueada!</Text>
            <Text style={styles.achievementName}>
              {newAchievements?.[0]?.name || 'Nova Conquista'}
            </Text>

            <TouchableOpacity 
              style={styles.achievementButton}
              onPress={() => setShowAchievementModal(false)}
            >
              <Text style={styles.achievementButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerButton: {
    padding: SIZES.sm,
  },
  headerButtonText: {
    fontSize: 24,
  },
  headerCenter: {
    alignItems: 'center',
  },
  chapterTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    textAlign: 'center',
  },
  readingTime: {
    fontSize: SIZES.fontSize.sm,
    marginTop: SIZES.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    marginRight: SIZES.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  content: {
    lineHeight: 28,
    textAlign: 'justify',
    paddingVertical: SIZES.lg,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
  },
  finishButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
  },
  navButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    width: screenWidth * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  settingSection: {
    marginBottom: SIZES.lg,
  },
  settingLabel: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.sm,
    padding: SIZES.sm,
    marginHorizontal: SIZES.sm,
  },
  fontButtonText: {
    color: COLORS.white,
    fontWeight: FONTS.weights.bold,
  },
  fontSizeDisplay: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginHorizontal: SIZES.md,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  themeOption: {
    borderRadius: SIZES.radius.sm,
    padding: SIZES.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: COLORS.primary,
  },
  themeOptionText: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
  },
  achievementModal: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xl,
    alignItems: 'center',
    width: screenWidth * 0.8,
  },
  achievementTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  achievementName: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },

  achievementButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
  },
  achievementButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default ReadingScreen;
