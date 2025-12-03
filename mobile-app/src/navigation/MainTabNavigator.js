import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import ReadingScreen from '../screens/main/ReadingScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

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

// Placeholder screen for Reading tab (will navigate to actual reading)
const ReadingTabScreen = ({ navigation }) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderIcon}>📖</Text>
      <Text style={styles.placeholderTitle}>Modo de Leitura</Text>
      <Text style={styles.placeholderText}>
        Selecione um livro para começar a ler
      </Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
  },
  iconWrapperFocused: {
    backgroundColor: COLORS.primary,
  },
  iconText: {
    fontSize: 20,
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
});

export default MainTabNavigator;