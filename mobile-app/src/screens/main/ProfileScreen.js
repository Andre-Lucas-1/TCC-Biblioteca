import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants';
import { logoutUser } from '../../store/slices/authSlice';
import { Logo } from '../../components';
import { fetchUserProfile, fetchUserStats } from '../../store/slices/userSlice';
import { fetchAchievements, selectAchievements } from '../../store/slices/gamificationSlice';
import { useFocusEffect } from '@react-navigation/native';


const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, stats } = useSelector((state) => state.user);
  const achievementsState = useSelector(selectAchievements);

  useEffect(() => {
    // Carregar dados do perfil
    dispatch(fetchUserProfile());
    dispatch(fetchUserStats());
    dispatch(fetchAchievements());
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchUserStats());
    }, [dispatch])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
          },
        },
      ],
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleAchievements = () => {
    navigation.navigate('Achievements');
  };


  const handleReadingGoals = () => {
    navigation.navigate('ReadingGoals');
  };

  const menuItems = [
    {
      icon: '🏆',
      title: 'Conquistas',
      subtitle: 'Suas conquistas e insígnias',
      onPress: handleAchievements,
    },
    {
      icon: '🎯',
      title: 'Metas de Leitura',
      subtitle: 'Defina e acompanhe suas metas',
      onPress: handleReadingGoals,
    },
    {
      icon: '⚙️',
      title: 'Configurações',
      subtitle: 'Preferências e configurações',
      onPress: handleSettings,
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
          rightComponent={
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          }
        />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '👤'}
              </Text>
            </View>

          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Nome do Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
            
            <View style={styles.joinDate}>
              <Text style={styles.joinDateText}>
                Membro desde {new Date().getFullYear()}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{(stats?.booksRead ?? stats?.totalBooksRead ?? 0)}</Text>
            <Text style={styles.statLabel}>Livros Lidos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{(stats?.readingTime ?? stats?.totalReadingTime ?? 0)}h</Text>
            <Text style={styles.statLabel}>Tempo de Leitura</Text>
          </View>
          
          
        </View>



        {Array.isArray(achievementsState.unlocked) && achievementsState.unlocked.length > 0 && (
          <View style={styles.achievementsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conquistas Recentes</Text>
              <TouchableOpacity onPress={handleAchievements}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {achievementsState.unlocked.slice(0, 8).map((a) => {
                const icon = a.icon || (achievementsState.available || []).find(av => av.id === a.id)?.icon || '🏆';
                return (
                  <View key={a.id} style={styles.achievementItem}>
                    <Text style={styles.achievementIcon}>{icon}</Text>
                    <Text style={styles.achievementTitle}>{a.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
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
  editText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    alignItems: 'center',
    marginBottom: SIZES.xl,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.fontSize.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },

  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  joinDate: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
  },
  joinDateText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    marginHorizontal: '1%',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statNumber: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  achievementsSection: {
    marginBottom: SIZES.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  seeAllText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.medium,
  },
  achievementsScroll: {
    paddingHorizontal: SIZES.lg,
  },
  achievementItem: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginRight: SIZES.md,
    alignItems: 'center',
    width: 100,
    ...SHADOWS.light,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: SIZES.sm,
  },
  achievementTitle: {
    fontSize: SIZES.fontSize.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SIZES.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  menuSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.textSecondary,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: SIZES.sm,
  },
  logoutText: {
    fontSize: SIZES.fontSize.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.white,
  },
});

export default ProfileScreen;
