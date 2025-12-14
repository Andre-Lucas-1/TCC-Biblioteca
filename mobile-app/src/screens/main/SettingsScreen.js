import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { Logo } from '../../components';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    readingReminders: true,
  });
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    (async () => {
      const current = await apiUtils.getApiBaseUrl();
      setApiUrl(current);
    })();
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Funcionalidade em desenvolvimento');
          },
        },
      ],
    );
  };

  const settingsItems = [
    {
      title: 'Notificações',
      subtitle: 'Receber notificações do app',
      type: 'switch',
      key: 'notifications',
      value: settings.notifications,
    },
    {
      title: 'Modo Escuro',
      subtitle: 'Usar tema escuro',
      type: 'switch',
      key: 'darkMode',
      value: settings.darkMode,
    },
    {
      title: 'Sincronização Automática',
      subtitle: 'Sincronizar dados automaticamente',
      type: 'switch',
      key: 'autoSync',
      value: settings.autoSync,
    },
    {
      title: 'Lembretes de Leitura',
      subtitle: 'Receber lembretes para ler',
      type: 'switch',
      key: 'readingReminders',
      value: settings.readingReminders,
    },
  ];

  const actionItems = [
    {
      title: 'Sobre o App',
      subtitle: 'Versão e informações',
      icon: 'ℹ️',
      onPress: () => Alert.alert('Sobre', 'App de Leitura v1.0.0'),
    },
    {
      title: 'Termos de Uso',
      subtitle: 'Leia nossos termos',
      icon: '📄',
      onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento'),
    },
    {
      title: 'Política de Privacidade',
      subtitle: 'Como tratamos seus dados',
      icon: '🔒',
      onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento'),
    },
    {
      title: 'Suporte',
      subtitle: 'Entre em contato conosco',
      icon: '💬',
      onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento'),
    },
  ];

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
        />

        <Text style={styles.title}>Configurações</Text>

        {/* API Server URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servidor da API</Text>
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Base URL</Text>
              <TextInput
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://IP:3000/api"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveApiUrl}>
              <Text style={styles.saveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>

        

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          {actionItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerButtonText}>Excluir Conta</Text>
          </TouchableOpacity>
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
  backText: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  title: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  settingSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  saveBtn: {
    marginLeft: SIZES.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.sm,
    alignSelf: 'center',
  },
  saveText: {
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: SIZES.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  actionSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  dangerSection: {
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
  },
  dangerTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.error,
    marginBottom: SIZES.md,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  dangerButtonText: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.white,
  },
});

export default SettingsScreen;
import { apiUtils } from '../../services/api';
  const saveApiUrl = async () => {
    try {
      await apiUtils.setApiBaseUrl(apiUrl);
      Alert.alert('Configurações', 'URL da API salva com sucesso');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a URL');
    }
  };
