import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';
import StyledModal from '../components/StyledModal';
import { AppLogo, GoogleIcon } from '../components/icons/BrandIcons';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  // El mensaje se conserva al cerrar para que no se vacíe durante la animación de salida
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      // Si el usuario cerró la ventana de Google no hay nada que avisar
      if (!error.message?.includes('cancelado')) {
        setErrorMessage(error.message || 'No se pudo iniciar sesión. Por favor, intenta de nuevo.');
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-1 items-center justify-center px-8">
        <View style={styles.logoBlock}>
          <View className="mb-6">
            <AppLogo size={88} />
          </View>
          <Text
            accessibilityRole="header"
            className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            Gesaccol
          </Text>
          <Text className={`text-base text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Gestiona tus recordatorios fiscales de forma fácil y segura
          </Text>
        </View>

        <View className="w-full max-w-sm">
          {/* Botón con el aspecto que piden las normas de marca de Google, no una variante de Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
            accessibilityState={{ disabled: loading, busy: loading }}
            android_ripple={{ color: colors.ripple }}
            className={`min-h-14 rounded-xl px-6 flex-row items-center justify-center border overflow-hidden ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
            }`}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <View className="mr-3">
                  <GoogleIcon size={22} />
                </View>
                <Text
                  className={`font-semibold text-base ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  Continuar con Google
                </Text>
              </>
            )}
          </Pressable>

          <Text className={`text-xs text-center mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad
          </Text>
        </View>
      </View>
      <StyledModal
        visible={showError}
        onClose={() => setShowError(false)}
        title="No se pudo iniciar sesión"
        message={errorMessage}
        buttons={[{ text: 'Entendido', onPress: () => setShowError(false) }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoBlock: { marginBottom: 48, alignItems: 'center' },
});
