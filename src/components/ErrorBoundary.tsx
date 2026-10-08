import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AlertIcon } from './icons/ActionIcons';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Si una pantalla falla al dibujarse, muestra un aviso con "Reintentar" en lugar de dejar
 * la app en blanco. Solo captura errores de render; los de peticiones o eventos se
 * gestionan donde ocurren.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Punto para conectar un servicio de reporte de errores (Sentry, Crashlytics…)
    console.error('[ErrorBoundary] Error al dibujar la interfaz:', error, info.componentStack);
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback onRetry={this.retry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-1 items-center justify-center px-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      accessibilityRole="alert"
    >
      <View
        className={`h-16 w-16 rounded-2xl items-center justify-center mb-5 ${
          isDark ? 'bg-amber-500/15' : 'bg-amber-50'
        }`}
      >
        <AlertIcon color={isDark ? '#fcd34d' : '#d97706'} size={32} />
      </View>
      <Text
        accessibilityRole="header"
        className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        Algo salió mal
      </Text>
      <Text className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Esta pantalla tuvo un problema. Tus datos están a salvo; puedes intentarlo de nuevo.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole="button"
        className="bg-blue-600 px-8 py-3.5 rounded-xl"
      >
        <Text className="text-white font-semibold">Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}
