import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { COLORS, SIZES } from '../constants';
import { loadUserFromStorage } from '../store/slices/authSlice';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Import additional screens
import ReadingScreen from '../screens/main/ReadingScreen';
import BookDetailsScreen from '../screens/main/BookDetailsScreen';
import ChaptersListScreen from '../screens/main/ChaptersListScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import ReadingGoalsScreen from '../screens/main/ReadingGoalsScreen';

const Stack = createStackNavigator();

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is already logged in when app starts
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        {isAuthenticated && user ? (
          // User is authenticated - show main app
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator} 
            />
            <Stack.Screen 
              name="ReadingScreen" 
              component={ReadingScreen}
              options={{
                presentation: 'modal',
                cardStyleInterpolator: ({ current, layouts }) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateY: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [layouts.screen.height, 0],
                          }),
                        },
                      ],
                    },
                  };
                },
              }}
            />
            <Stack.Screen name="ChaptersList" component={ChaptersListScreen} />
            {/* Additional screens */}
            <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="ReadingGoals" component={ReadingGoalsScreen} />
          </>
        ) : (
          // User is not authenticated - show auth screens
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default AppNavigator;
