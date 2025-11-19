import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const logoScale = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada del logo
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert(
        'Error de Autenticación',
        error.message || 'No se pudo iniciar sesión. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-1 items-center justify-center px-8">
        <AnimatedView animationType="slideDown" delay={0} duration={600}>
          <Animated.View
            style={{
              transform: [{ scale: logoScale }],
              marginBottom: 48,
              alignItems: 'center',
            }}
          >
            <Text className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gesaccol
            </Text>
            <Text className={`text-lg text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Gestiona tus recordatorios fiscales de forma fácil y segura
            </Text>
          </Animated.View>
        </AnimatedView>

        <AnimatedView animationType="slideUp" delay={200} duration={600}>
          <View className="w-full max-w-sm">
            <AnimatedButton onPress={handleSignIn} disabled={loading}>
              <View
                className={`rounded-lg py-4 px-6 flex-row items-center justify-center border-2 ${
                  loading ? 'opacity-50' : ''
                } ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#4285F4" />
                ) : (
                  <>
                    <Image
                      source={{
                        uri: 'https://www.google.com/favicon.ico',
                      }}
                      className="w-6 h-6 mr-3"
                    />
                    <Text className={`font-semibold text-base ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Continuar con Google
                    </Text>
                  </>
                )}
              </View>
            </AnimatedButton>

            <AnimatedView animationType="fadeIn" delay={400} duration={500}>
              <Text className={`text-xs text-center mt-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Al iniciar sesión, aceptas nuestros términos de servicio y política
                de privacidad
              </Text>
            </AnimatedView>
          </View>
        </AnimatedView>
      </View>
    </SafeAreaView>
  );
}

