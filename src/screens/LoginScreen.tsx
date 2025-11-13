import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-12 items-center">
          <Text className="text-4xl font-bold text-gray-900 mb-4">
            AppRecordatorios
          </Text>
          <Text className="text-lg text-gray-600 text-center">
            Gestiona tus recordatorios fiscales de forma fácil y segura
          </Text>
        </View>

        <View className="w-full max-w-sm">
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className={`bg-white border-2 border-gray-300 rounded-lg py-4 px-6 flex-row items-center justify-center ${
              loading ? 'opacity-50' : ''
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
                <Text className="text-gray-700 font-semibold text-base">
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center mt-6">
            Al iniciar sesión, aceptas nuestros términos de servicio y política
            de privacidad
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

