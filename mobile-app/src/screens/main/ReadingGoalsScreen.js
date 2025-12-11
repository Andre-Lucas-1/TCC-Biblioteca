import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';

const ReadingGoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Livros por Ano',
      target: 24,
      current: 8,
      type: 'books',
      period: 'year',
      active: true,
    },
    {
      id: 2,
      title: 'Minutos por Dia',
      target: 30,
      current: 22,
      type: 'minutes',
      period: 'day',
      active: true,
    },
    {
      id: 3,
      title: 'Páginas por Semana',
      target: 200,
      current: 156,
      type: 'pages',
      period: 'week',
      active: false,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    type: 'books',
    period: 'year',
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.target) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const goal = {
      id: Date.now(),
      title: newGoal.title,
      target: parseInt(newGoal.target),
      current: 0,
      type: newGoal.type,
      period: newGoal.period,
      active: true,
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: '', target: '', type: 'books', period: 'year' });
    setModalVisible(false);
  };

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

  const renderGoal = (goal) => {
    const progress = getProgressPercentage(goal.current, goal.target);
    const isCompleted = progress >= 100;

    return (
      <View key={goal.id} style={[styles.goalCard, !goal.active && styles.inactiveGoal]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={[styles.goalTitle, !goal.active && styles.inactiveText]}>
              {goal.title}
            </Text>
            <Text style={[styles.goalSubtitle, !goal.active && styles.inactiveText]}>
              {goal.target} {getTypeLabel(goal.type)} {getPeriodLabel(goal.period)}
            </Text>
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              onPress={() => toggleGoal(goal.id)}
              style={styles.actionButton}
            >
              <Text style={styles.actionIcon}>
                {goal.active ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteGoal(goal.id)}
              style={styles.actionButton}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, !goal.active && styles.inactiveText]}>
              {goal.current} / {goal.target}
            </Text>
            <Text style={[styles.progressPercentage, !goal.active && styles.inactiveText]}>
              {Math.round(progress)}%
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? COLORS.success : 
                                 goal.active ? COLORS.primary : COLORS.gray[300]
                }
              ]} 
            />
          </View>
          
          {isCompleted && (
            <Text style={styles.completedText}>🎉 Meta concluída!</Text>
          )}
        </View>
      </View>
    );
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

        <Text style={styles.title}>Metas de Leitura</Text>

        {/* Goals Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{goals.filter(g => g.active).length}</Text>
            <Text style={styles.summaryLabel}>Metas Ativas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {goals.filter(g => getProgressPercentage(g.current, g.target) >= 100).length}
            </Text>
            <Text style={styles.summaryLabel}>Concluídas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {Math.round(
                goals.reduce((acc, goal) => acc + getProgressPercentage(goal.current, goal.target), 0) / goals.length
              )}%
            </Text>
            <Text style={styles.summaryLabel}>Progresso Médio</Text>
          </View>
        </View>

        {/* Goals List */}
        <View style={styles.goalsSection}>
          {goals.length > 0 ? (
            goals.map(renderGoal)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>Nenhuma meta definida</Text>
              <Text style={styles.emptyText}>
                Crie sua primeira meta de leitura para começar a acompanhar seu progresso!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Meta</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título da Meta</Text>
              <TextInput
                style={styles.input}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({...newGoal, title: text})}
                placeholder="Ex: Livros por ano"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                value={newGoal.target}
                onChangeText={(text) => setNewGoal({...newGoal, target: text})}
                placeholder="Ex: 24"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo</Text>
              <View style={styles.optionsRow}>
                {['books', 'minutes', 'pages'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      newGoal.type === type && styles.selectedOption
                    ]}
                    onPress={() => setNewGoal({...newGoal, type})}
                  >
                    <Text style={[
                      styles.optionText,
                      newGoal.type === type && styles.selectedOptionText
                    ]}>
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Período</Text>
              <View style={styles.optionsRow}>
                {['day', 'week', 'month', 'year'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.optionButton,
                      newGoal.period === period && styles.selectedOption
                    ]}
                    onPress={() => setNewGoal({...newGoal, period})}
                  >
                    <Text style={[
                      styles.optionText,
                      newGoal.period === period && styles.selectedOptionText
                    ]}>
                      {getPeriodLabel(period).replace('por ', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddGoal}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
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
  goalsSection: {
    paddingHorizontal: SIZES.lg,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
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
  },
  goalSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  inactiveText: {
    color: COLORS.gray[400],
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: SIZES.sm,
  },
  actionIcon: {
    fontSize: 20,
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
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    marginBottom: SIZES.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completedText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.success,
    fontWeight: FONTS.weights.medium,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
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
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.md,
    marginRight: SIZES.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.md,
    marginLeft: SIZES.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default ReadingGoalsScreen;