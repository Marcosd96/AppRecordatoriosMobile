import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { isDark } = useTheme();
  
  // Animaciones
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const backgroundScale = useRef(new Animated.Value(1.2)).current;

  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Animación del fondo
      Animated.timing(backgroundScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Animación del logo con rotación y escala
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Animación del título
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Animación del subtítulo
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          delay: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          delay: 100,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Pausa antes de terminar
      Animated.delay(800),
      // Fade out
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, [
    backgroundScale,
    logoOpacity,
    logoRotate,
    logoScale,
    onFinish,
    subtitleOpacity,
    subtitleTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
    >
      {/* Fondo animado con degradado simulado */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            transform: [{ scale: backgroundScale }],
          },
        ]}
        className={isDark ? 'bg-gradient-dark' : 'bg-gradient-light'}
      >
        {/* Círculos decorativos */}
        <View style={styles.circle1} className={isDark ? 'bg-blue-500/20' : 'bg-blue-400/20'} />
        <View style={styles.circle2} className={isDark ? 'bg-purple-500/20' : 'bg-purple-400/20'} />
      </Animated.View>

      {/* Contenido principal */}
      <View className="flex-1 items-center justify-center">
        {/* Logo animado */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: logoRotation },
            ],
          }}
        >
          <View 
            className={`w-32 h-32 rounded-3xl items-center justify-center ${
              isDark ? 'bg-blue-600' : 'bg-blue-500'
            }`}
            style={styles.logoContainer}
          >
            <Text style={styles.logoEmoji}>📋</Text>
          </View>
        </Animated.View>

        {/* Título */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            marginTop: 32,
          }}
        >
          <Text 
            className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={styles.title}
          >
            Gesaccol
          </Text>
        </Animated.View>

        {/* Subtítulo */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
            marginTop: 16,
            paddingHorizontal: 40,
          }}
        >
          <Text 
            className={`text-lg text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            style={styles.subtitle}
          >
            Gestión de recordatorios fiscales
          </Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View
        style={{
          opacity: subtitleOpacity,
          paddingBottom: 40,
          alignItems: 'center',
        }}
      >
        <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Versión 1.0.0
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    position: 'absolute',
    width: width,
    height: height,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -50,
    left: -80,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  logoEmoji: {
    fontSize: 64,
  },
  title: {
    letterSpacing: 1,
  },
  subtitle: {
    letterSpacing: 0.5,
  },
});

