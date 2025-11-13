import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomePermissionsScreen from '../screens/WelcomePermissionsScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RemindersScreen from '../screens/RemindersScreen';
import CompaniesScreen from '../screens/CompaniesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom - 5, 0),
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
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

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
      // Después del onboarding, mostrar la pantalla de permisos
      setShowPermissions(true);
    } catch (error) {
      console.error('Error saving launch status:', error);
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

  if (loading || isFirstLaunch === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isFirstLaunch && !showPermissions ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : isFirstLaunch && showPermissions ? (
          <Stack.Screen name="WelcomePermissions">
            {(props) => (
              <WelcomePermissionsScreen
                {...props}
                onComplete={handlePermissionsComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
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

