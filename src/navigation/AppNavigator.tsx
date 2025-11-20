import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomePermissionsScreen from '../screens/WelcomePermissionsScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PersonalTasksScreen from '../screens/PersonalTasksScreen';
import RemindersScreen from '../screens/RemindersScreen';
import CompaniesScreen from '../screens/CompaniesScreen';
import NotificationTroubleshootingScreen from '../screens/NotificationTroubleshootingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const responsive = useResponsive();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: Math.max(insets.bottom, responsive.spacing.xs),
          paddingTop: responsive.spacing.xs,
          height: responsive.scale(60) + Math.max(insets.bottom - responsive.spacing.xs, 0),
        },
        tabBarLabelStyle: {
          fontSize: responsive.fontSize.xs,
        },
        tabBarIconStyle: {
          marginTop: responsive.spacing.xs,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="PersonalTasks"
        component={PersonalTasksScreen}
        options={{
          tabBarLabel: 'Tareas',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>✅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarLabel: 'Recordatorios',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Companies"
        component={CompaniesScreen}
        options={{
          tabBarLabel: 'Empresas',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏢</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigatorContent() {
  const { isAuthenticated, loading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    checkFirstLaunch();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      setHasCompletedOnboarding(onboardingCompleted === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(hasLaunched === null);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(true);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handlePermissionsComplete = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      setIsFirstLaunch(false);
      setShowPermissions(false);
    } catch (error) {
      console.error('Error saving launch status:', error);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const { isDark } = useTheme();

  if (loading || hasCompletedOnboarding === null || isFirstLaunch === null) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className={isDark ? 'text-gray-300 mt-4' : 'text-gray-600 mt-4'}>Cargando...</Text>
      </View>
    );
  }

  // Configuración de transiciones animadas
  const screenOptions = {
    headerShown: false,
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
          opacity: current.progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
          }),
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring' as const,
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
      close: {
        animation: 'spring' as const,
        config: {
          stiffness: 1000,
          damping: 500,
          mass: 3,
          overshootClamping: true,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
      },
    },
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {showSplash ? (
          // Mostrar splash screen primero
          <Stack.Screen name="Splash">
            {(props) => (
              <SplashScreen
                {...props}
                onFinish={handleSplashFinish}
              />
            )}
          </Stack.Screen>
        ) : !hasCompletedOnboarding ? (
          // Mostrar onboarding primero (antes del login)
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          // Después del onboarding, mostrar login
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isFirstLaunch && !showPermissions ? (
          // Si es el primer lanzamiento después del login, mostrar permisos
          <Stack.Screen name="WelcomePermissions">
            {(props) => (
              <WelcomePermissionsScreen
                {...props}
                onComplete={handlePermissionsComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          // Pantalla principal
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="NotificationTroubleshooting" 
              component={NotificationTroubleshootingScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <AppNavigatorContent />
    </AuthProvider>
  );
}

