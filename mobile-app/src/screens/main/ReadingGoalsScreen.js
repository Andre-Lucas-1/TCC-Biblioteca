import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchGoalsProgress, updateReadingGoals, fetchUserGoals, createUserGoal, updateUserGoal, deleteUserGoal, addGoalLocal, removeGoalLocal } from '../../store/slices/userSlice';
import { useFocusEffect } from '@react-navigation/native';
import ui from '../../theme/ui';

const ReadingGoalsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { stats, goals, isLoadingGoals } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const scrollRef = useRef(null);
  const [localGoals, setLocalGoals] = useState([]);
  const [pendingGoalId, setPendingGoalId] = useState(null);
  const userId = user?._id || user?.id || user?.userId || user?.email;
  const cacheKey = userId ? `userGoals:${userId}` : null;
  const [goalBaselines, setGoalBaselines] = useState({});
  const [goalLastProgress, setGoalLastProgress] = useState({});
  const baselineKeyFor = (id) => (userId ? `goalBaseline:${userId}:${id}` : null);
  const lastKeyFor = (id) => (userId ? `goalLastProgress:${userId}:${id}` : null);
  const createdListKey = userId ? `goalCreatedList:${userId}` : null;
  const [createdList, setCreatedList] = useState([]);

  const loadCachedGoals = async () => {
    try {
      if (!cacheKey) return;
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setLocalGoals(arr);
      }
    } catch (e) {}
  };
  const saveCachedGoals = async (arr) => {
    try {
      if (!cacheKey) return;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(arr));
    } catch (e) {}
  };
  const loadBaselines = async (goalsList) => {
    try {
      const entries = Array.isArray(goalsList) ? goalsList : [];
      const result = {};
      for (const g of entries) {
        const id = g._id || g.id; if (!id) continue;
        const key = baselineKeyFor(id);
        if (!key) continue;
        const raw = await AsyncStorage.getItem(key);
        if (raw) { try { result[id] = JSON.parse(raw); } catch {} }
      }
      setGoalBaselines(result);
    } catch {}
  };
  const loadLastProgress = async (goalsList) => {
    try {
      const entries = Array.isArray(goalsList) ? goalsList : [];
      const result = {};
      for (const g of entries) {
        const id = g._id || g.id; if (!id) continue;
        const key = lastKeyFor(id);
        if (!key) continue;
        const raw = await AsyncStorage.getItem(key);
        if (raw) { try { const num = JSON.parse(raw); if (typeof num === 'number') result[id] = num; } catch {} }
      }
      setGoalLastProgress(result);
    } catch {}
  };
  const saveBaselineFor = async (id) => {
    try {
      const obj = {
        createdAt: Date.now(),
        dailyMinutes: stats?.goalsProgress?.dailyMinutes || 0,
        weeklyBooks: stats?.goalsProgress?.weeklyBooks || 0,
        monthlyBooks: stats?.goalsProgress?.monthlyBooks || 0,
      };
      await AsyncStorage.setItem(baselineKeyFor(id), JSON.stringify(obj));
      setGoalBaselines((prev) => ({ ...prev, [id]: obj }));
    } catch {}
  };
  const addCreatedRecord = async (id) => {
    try {
      const ts = Date.now();
      const next = [...createdList.filter(x => x && x.id), { id, ts }];
      setCreatedList(next);
      await AsyncStorage.setItem(createdListKey, JSON.stringify(next));
    } catch {}
  };
  const loadCreatedRecords = async () => {
    try {
      const raw = await AsyncStorage.getItem(createdListKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setCreatedList(arr);
      }
    } catch {}
  };

  const displayGoals = useMemo(() => {
    const baseGoals = Array.isArray(goals) ? goals : [];
    return [...localGoals.filter(lg => !baseGoals.some(bg => bg._id === lg._id)), ...baseGoals];
  }, [localGoals, goals]);
  useEffect(() => {
    setLocalGoals([]);
    setGoalBaselines({});
    setGoalLastProgress({});
    setCreatedList([]);
  }, [userId]);
  useEffect(() => {
    const run = async () => {
      const key = userId ? `alertedGoals:${userId}` : null;
      let alerted = [];
      try {
        if (key) {
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) alerted = arr;
          }
        }
      } catch {}
      const next = [...alerted];
      displayGoals.forEach(async g => {
        const id = g._id || g.id;
        const base = id ? goalBaselines[id] : undefined;
        let currentVal = g.current || 0;
        if (base) {
          if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
          if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
          if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
        }
        let last = id ? goalLastProgress[id] : undefined;
        if (last === undefined && base) last = 0;
        const target = g.target || 0;
        const justCompleted = typeof last === 'number' && last < target && currentVal >= target && currentVal > last && g.active !== false;
        if (justCompleted && id && !next.includes(id)) {
          Alert.alert('Meta concluída', g.title || 'Meta');
          next.push(id);
        }
      });
      if (key) { try { await AsyncStorage.setItem(key, JSON.stringify(next)); } catch {} }
    };
    run();
  }, [displayGoals, stats?.goalsProgress?.dailyMinutes, stats?.goalsProgress?.weeklyBooks, stats?.goalsProgress?.monthlyBooks, userId]);

  useEffect(() => {
    const run = async () => {
      const key = userId ? `alertedBuiltins:${userId}` : null;
      let alerted = {};
      try {
        if (key) {
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj && typeof obj === 'object') alerted = obj;
          }
        }
      } catch {}
      const dailyPct2 = Math.min(100, Math.round(((stats?.goalsProgress?.dailyMinutes || 0) / (stats?.readingGoals?.daily || 1)) * 100));
      const weeklyPct2 = Math.min(100, Math.round(((stats?.goalsProgress?.weeklyBooks || 0) / (stats?.readingGoals?.weekly || 1)) * 100));
      const monthlyPct2 = Math.min(100, Math.round(((stats?.goalsProgress?.monthlyBooks || 0) / (stats?.readingGoals?.monthly || 1)) * 100));
      let changed = false;
      if (dailyPct2 >= 100 && !alerted.daily) { Alert.alert('Meta diária concluída', 'Parabéns!'); alerted.daily = true; changed = true; }
      if (weeklyPct2 >= 100 && !alerted.weekly) { Alert.alert('Meta semanal concluída', 'Parabéns!'); alerted.weekly = true; changed = true; }
      if (monthlyPct2 >= 100 && !alerted.monthly) { Alert.alert('Meta mensal concluída', 'Parabéns!'); alerted.monthly = true; changed = true; }
      if (changed && key) { try { await AsyncStorage.setItem(key, JSON.stringify(alerted)); } catch {} }
    };
    run();
  }, [stats?.goalsProgress?.dailyMinutes, stats?.goalsProgress?.weeklyBooks, stats?.goalsProgress?.monthlyBooks, stats?.readingGoals?.daily, stats?.readingGoals?.weekly, stats?.readingGoals?.monthly, userId]);

  useEffect(() => {
    if (Array.isArray(displayGoals) && displayGoals.length > 0) {
      saveCachedGoals(displayGoals);
    }
  }, [goals, localGoals]);
  useEffect(() => { loadBaselines(displayGoals); loadLastProgress(displayGoals); }, [displayGoals]);
  useEffect(() => { loadCreatedRecords(); }, []);
  const [daily, setDaily] = useState(String(stats?.readingGoals?.daily || 30));
  const [weekly, setWeekly] = useState(String(stats?.readingGoals?.weekly || 3));
  const [monthly, setMonthly] = useState(String(stats?.readingGoals?.monthly || 12));

  const lastFetchRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchRef.current > 15000) {
      lastFetchRef.current = now;
      dispatch(fetchGoalsProgress());
      dispatch(fetchUserGoals());
      loadCachedGoals();
    }
  }, [dispatch]);

  useEffect(() => {
    loadCachedGoals();
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > 15000) {
        lastFetchRef.current = now;
        dispatch(fetchUserGoals());
        dispatch(fetchGoalsProgress());
        loadCachedGoals();
      }
    }, [dispatch])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    const d = Math.max(0, parseInt(daily || '0'));
    const w = Math.max(0, parseInt(weekly || '0'));
    const m = Math.max(0, parseInt(monthly || '0'));
    dispatch(updateReadingGoals({ daily: d, weekly: w, monthly: m }));
    navigation.goBack();
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', type: 'minutes', period: 'week' });
  const [creatingGoal, setCreatingGoal] = useState(false);
  const handleCreateGoal = async () => {
    const title = (newGoal.title || '').trim();
    const target = parseInt(newGoal.target || '0');
    if (!title) {
      Alert.alert('Campos obrigatórios', 'Informe o título da meta');
      return;
    }
    if (!(target > 0)) {
      Alert.alert('Campos obrigatórios', 'Informe uma quantidade válida (> 0)');
      return;
    }
    try {
      setCreatingGoal(true);
      setModalVisible(false);
      const optimisticId = `tmp-${Date.now()}`;
      const optimistic = { _id: optimisticId, title, target, type: newGoal.type, period: newGoal.period, active: true, current: 0, percentage: 0 };
      setPendingGoalId(optimisticId);
      setLocalGoals((prev) => [optimistic, ...prev]);
      const action = await dispatch(createUserGoal({
        title,
        target,
        type: newGoal.type,
        period: newGoal.period,
      }));
      if (action.meta.requestStatus === 'fulfilled') {
        const created = action.payload?.goal;
        setNewGoal({ title: '', target: '', type: 'minutes', period: 'week' });
        if (created) {
          dispatch(addGoalLocal(created));
          setLocalGoals((prev) => {
            const replaced = prev.map(g => g._id === optimisticId ? { ...created, current: 0, percentage: 0 } : g);
            const exists = replaced.some(g => g._id === created._id);
            const nextList = exists ? replaced : [{ ...created, current: 0, percentage: 0 }, ...replaced];
            saveCachedGoals(nextList);
            return nextList;
          });
          await saveBaselineFor(created._id || created.id);
          await addCreatedRecord(created._id || created.id);
          setPendingGoalId(null);
        }
        dispatch(fetchUserGoals());
        Alert.alert('Meta criada', 'Sua meta foi adicionada com sucesso');
        setTimeout(() => { scrollRef.current?.scrollToEnd?.({ animated: true }); }, 200);
      } else {
        setModalVisible(true);
        setLocalGoals((prev) => {
          const nextList = prev.filter(g => g._id !== optimisticId);
          saveCachedGoals(nextList);
          return nextList;
        });
        setPendingGoalId(null);
        Alert.alert('Falha ao salvar', typeof action.payload === 'string' ? action.payload : 'Não foi possível criar a meta');
      }
    } finally {
      setCreatingGoal(false);
    }
  };
  const toggleActive = async (id, active) => {
    await dispatch(updateUserGoal({ id, updates: { active: !active } }));
    dispatch(fetchUserGoals());
  };
  const removeGoal = async (id) => {
    setLocalGoals((prev) => {
      const nextList = prev.filter(g => g._id !== id);
      saveCachedGoals(nextList);
      return nextList;
    });
    dispatch(removeGoalLocal(id));
    try {
      await dispatch(deleteUserGoal(id)).unwrap();
    } catch (e) {
      Alert.alert('Falha ao excluir', 'Não foi possível excluir a meta agora');
    }
    dispatch(fetchUserGoals());
  };
  const periodPt = (p) => ({ day: 'Dia', week: 'Semana', month: 'Mês', year: 'Ano' }[p] || p);

  const toggleGoal = (id) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, active: !goal.active } : goal
    ));
  };

  const deleteGoal = (id) => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => setGoals(goals.filter(goal => goal.id !== id)),
        },
      ]
    );
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'books': return 'livros';
      case 'minutes': return 'minutos';
      case 'pages': return 'páginas';
      default: return type;
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'day': return 'por dia';
      case 'week': return 'por semana';
      case 'month': return 'por mês';
      case 'year': return 'por ano';
      default: return period;
    }
  };

  const dailyProgressPct = Math.min(100, Math.round(((stats?.goalsProgress?.dailyMinutes || 0) / (parseInt(daily || '1'))) * 100));
  const weeklyProgressPct = Math.min(100, Math.round(((stats?.goalsProgress?.weeklyBooks || 0) / (parseInt(weekly || '1'))) * 100));
  const monthlyProgressPct = Math.min(100, Math.round(((stats?.goalsProgress?.monthlyBooks || 0) / (parseInt(monthly || '1'))) * 100));

  return (
    <SafeAreaView style={ui.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        ref={scrollRef}
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
          rightComponent={
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.addText}>+ Nova</Text>
            </TouchableOpacity>
          }
        />

        <Text style={[styles.title, ui.screenPadding]}>Metas de Leitura</Text>

        <View style={[styles.summaryCard, ui.card]}> 
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats?.goalsProgress?.dailyMinutes || 0} min</Text>
            <Text style={styles.summaryLabel}>Hoje</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats?.goalsProgress?.weeklyBooks || 0}</Text>
            <Text style={styles.summaryLabel}>Livros na Semana</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats?.goalsProgress?.monthlyBooks || 0}</Text>
            <Text style={styles.summaryLabel}>Livros no Mês</Text>
          </View>
        </View>

        <View style={[styles.goalsSection, ui.screenPadding]}>
          <View style={[styles.goalCard, ui.card]}>
            <Text style={styles.goalTitle}>Meta diária (minutos)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputInline}
                value={daily}
                onChangeText={setDaily}
                keyboardType="numeric"
                placeholder="Ex: 30"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${dailyProgressPct}%`, backgroundColor: COLORS.primary }]} /></View>
            <Text style={styles.progressSub}>{stats?.goalsProgress?.dailyMinutes || 0} / {parseInt(daily || '0')} min</Text>
            {dailyProgressPct >= 100 && (
              <Text style={styles.progressSub}>Concluída</Text>
            )}
          </View>

          <View style={[styles.goalCard, ui.card]}>
            <Text style={styles.goalTitle}>Meta semanal (livros)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputInline}
                value={weekly}
                onChangeText={setWeekly}
                keyboardType="numeric"
                placeholder="Ex: 3"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${weeklyProgressPct}%`, backgroundColor: COLORS.primary }]} /></View>
            <Text style={styles.progressSub}>{stats?.goalsProgress?.weeklyBooks || 0} / {parseInt(weekly || '0')} livros</Text>
            {weeklyProgressPct >= 100 && (
              <Text style={styles.progressSub}>Concluída</Text>
            )}
          </View>

          <View style={[styles.goalCard, ui.card]}>
            <Text style={styles.goalTitle}>Meta mensal (livros)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputInline}
                value={monthly}
                onChangeText={setMonthly}
                keyboardType="numeric"
                placeholder="Ex: 12"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${monthlyProgressPct}%`, backgroundColor: COLORS.primary }]} /></View>
            <Text style={styles.progressSub}>{stats?.goalsProgress?.monthlyBooks || 0} / {parseInt(monthly || '0')} livros</Text>
            {monthlyProgressPct >= 100 && (
              <Text style={styles.progressSub}>Concluída</Text>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.goalCard, ui.card]}>
            <Text style={styles.goalTitle}>Minhas metas</Text>
            {isLoadingGoals && <Text style={styles.progressSub}>Carregando...</Text>}
            <View>
              {displayGoals.length === 0 ? (
                <Text style={styles.progressSub}>Nenhuma meta personalizada</Text>
              ) : (
                displayGoals.map(g => {
                  const id = g._id || g.id;
                  const base = id ? goalBaselines[id] : undefined;
                  let currentVal = (g.current !== undefined && g.current !== null) ? g.current : 0;
                  if (base) {
                    if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
                    if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
                    if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
                  }
                  const last = id ? goalLastProgress[id] : undefined;
                  const pct = g.target > 0 ? Math.min(100, Math.round(((currentVal) / g.target) * 100)) : 0;
                  try { if (id) AsyncStorage.setItem(lastKeyFor(id), JSON.stringify(currentVal)); } catch {}
                  return (pct < 100) ? (
                    <View key={g._id} style={{ marginTop: SIZES.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.goalTitle} numberOfLines={1} ellipsizeMode="tail">{g.title}</Text>
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity onPress={() => toggleActive(g._id, g.active)} style={{ marginRight: SIZES.sm }}>
                            <Text style={styles.progressSub}>{g.active ? 'Desativar' : 'Ativar'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeGoal(g._id)}>
                            <Text style={styles.progressSub}>Excluir</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.progressSub}>{currentVal} / {g.target} {g.type === 'minutes' ? 'min' : 'livros'} ({periodPt(g.period)})</Text>
                      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: COLORS.primary }]} /></View>
                      {(() => {
                        const createdMs = g.createdAt ? new Date(g.createdAt).getTime() : (base?.createdAt ? base.createdAt : undefined);
                        const isNewBackend = createdMs ? ((Date.now() - createdMs) < 5 * 60 * 1000) : false;
                        const isNewLocal = Array.isArray(createdList) && !!createdList.find(x => x.id === (g._id || g.id) && ((Date.now() - x.ts) < 5 * 60 * 1000));
                        const show = isNewBackend || isNewLocal;
                        return show ? (<Text style={styles.progressSub}>Meta criada</Text>) : null;
                      })()}
                    </View>
                  ) : null;
                })
              )}
            </View>
          </View>

          <View style={[styles.goalCard, ui.card]}>
            <Text style={styles.goalTitle}>Metas concluídas</Text>
            <View>
              {displayGoals.filter(g => {
                const id = g._id || g.id; const base = goalBaselines[id];
                let currentVal = (g.current !== undefined && g.current !== null) ? g.current : 0;
                if (base) {
                  if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
                  if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
                  if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
                }
                const pct = g.target > 0 ? Math.min(100, Math.round(((currentVal) / g.target) * 100)) : 0;
                return pct >= 100;
              }).length === 0 ? (
                <Text style={styles.progressSub}>Nenhuma concluída</Text>
              ) : (
                displayGoals.map(g => {
                  const id = g._id || g.id; const base = goalBaselines[id];
                  let currentVal = (g.current !== undefined && g.current !== null) ? g.current : 0;
                  if (base) {
                    if (g.type === 'minutes' && g.period === 'day') currentVal = Math.max(0, (stats?.goalsProgress?.dailyMinutes || 0) - (base.dailyMinutes || 0));
                    if (g.type === 'books' && g.period === 'week') currentVal = Math.max(0, (stats?.goalsProgress?.weeklyBooks || 0) - (base.weeklyBooks || 0));
                    if (g.type === 'books' && g.period === 'month') currentVal = Math.max(0, (stats?.goalsProgress?.monthlyBooks || 0) - (base.monthlyBooks || 0));
                  }
                  const pct = g.target > 0 ? Math.min(100, Math.round(((currentVal) / g.target) * 100)) : 0;
                  if (pct < 100) return null;
                  return (
                    <View key={`done-${g._id}`} style={{ marginTop: SIZES.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.goalTitle} numberOfLines={1} ellipsizeMode="tail">{g.title}</Text>
                        <Text style={styles.progressSub}>Concluída</Text>
                      </View>
                      <Text style={styles.progressSub}>{g.type === 'minutes' ? 'Minutos' : 'Livros'} ({periodPt(g.period)})</Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, ui.card]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Nova meta</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput style={styles.input} value={newGoal.title} onChangeText={(t) => setNewGoal({ ...newGoal, title: t })} placeholder="Ex: Ler 2 livros" placeholderTextColor={COLORS.textSecondary} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <TextInput style={styles.input} value={newGoal.target} onChangeText={(t) => setNewGoal({ ...newGoal, target: t })} keyboardType="numeric" placeholder="Ex: 2" placeholderTextColor={COLORS.textSecondary} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo da meta</Text>
              <View style={styles.optionsRow}>
                {['minutes','books'].map(type => (
                  <TouchableOpacity key={type} style={[styles.optionButton, newGoal.type === type && styles.selectedOption]} onPress={() => setNewGoal({ ...newGoal, type })}>
                    <Text style={[styles.optionText, newGoal.type === type && styles.selectedOptionText]}>{type === 'minutes' ? 'Minutos' : 'Livros'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Período</Text>
              <View style={styles.optionsRow}>
                {['day','week','month','year'].map(period => (
                  <TouchableOpacity key={period} style={[styles.optionButton, newGoal.period === period && styles.selectedOption]} onPress={() => setNewGoal({ ...newGoal, period })}>
                    <Text style={[styles.optionText, newGoal.period === period && styles.selectedOptionText]}>{periodPt(period)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>✖️ Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, creatingGoal && { opacity: 0.6 }]} onPress={creatingGoal ? undefined : handleCreateGoal} disabled={creatingGoal}>
                <Text style={styles.saveButtonText}>{creatingGoal ? 'Salvando...' : '✅ Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  addText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
  title: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
    ...SHADOWS.medium,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  goalsSection: {},
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  inactiveGoal: {
    opacity: 0.6,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    flexShrink: 1,
  },
  goalSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  inactiveText: {
    color: COLORS.gray[400],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  inputInline: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
  },
  progressSection: {
    marginTop: SIZES.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  progressText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  progressPercentage: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.gray[200],
    borderRadius: 5,
    marginBottom: SIZES.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSub: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.lg,
  },
  emptyTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  emptyText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.lg,
  },
  actionsRow: {
    marginTop: SIZES.lg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  modalTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gray[300],
    marginBottom: SIZES.md,
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.full,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.sm,
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text,
  },
  selectedOptionText: {
    color: COLORS.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.lg,
  },
  cancelButton: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.lg,
    marginRight: SIZES.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.lg,
    alignItems: 'center',
    flexBasis: '48%',
  },
  saveButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default ReadingGoalsScreen;
