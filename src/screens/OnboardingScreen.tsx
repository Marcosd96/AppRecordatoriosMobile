import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import AnimatedView from '../components/AnimatedView';
import AnimatedButton from '../components/AnimatedButton';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingData = [
  {
    title: 'Bienvenido a Gesaccol',
    description: 'Tu asistente inteligente para gestionar recordatorios fiscales de manera fácil y eficiente',
    icon: '📋',
  },
  {
    title: 'Gestiona tus Empresas',
    description: 'Agrega y administra todas tus empresas con sus respectivos NITs y calendarios fiscales',
    icon: '🏢',
  },
  {
    title: 'Recordatorios Automáticos',
    description: 'Recibe notificaciones automáticas de tus obligaciones fiscales según los calendarios de la DIAN',
    icon: '🔔',
  },
  {
    title: 'Todo en un Solo Lugar',
    description: 'Visualiza todos tus recordatorios pendientes, vencidos y próximos en un solo lugar',
    icon: '📊',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const skipButtonOpacity = useRef(new Animated.Value(1)).current;
  const skipButtonHeight = useRef(new Animated.Value(1)).current;
  const skipButtonMarginTop = useRef(new Animated.Value(16)).current; // mt-4 = 16px
  const scrollAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const opacityAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Animar el botón "Saltar" cuando cambia la página
    const isLastPage = currentPage === onboardingData.length - 1;
    
    // Cancelar animaciones anteriores
    if (opacityAnimationRef.current) {
      opacityAnimationRef.current.stop();
    }
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    
    // Animar propiedades que usan native driver
    opacityAnimationRef.current = Animated.timing(skipButtonOpacity, {
      toValue: isLastPage ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    });
    opacityAnimationRef.current.start(() => {
      opacityAnimationRef.current = null;
    });
    
    // Animar propiedades que NO usan native driver por separado
    scrollAnimationRef.current = Animated.parallel([
      Animated.timing(skipButtonHeight, {
        toValue: isLastPage ? 0 : 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(skipButtonMarginTop, {
        toValue: isLastPage ? 0 : 16,
        duration: 400,
        useNativeDriver: false,
      }),
    ]);
    scrollAnimationRef.current.start(() => {
      scrollAnimationRef.current = null;
    });
  }, [currentPage, skipButtonHeight, skipButtonMarginTop, skipButtonOpacity]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
    
    // Animar el botón "Saltar" progresivamente cuando se acerca a la última página
    const lastPageIndex = onboardingData.length - 1;
    const currentPageFloat = offsetX / width;
    const isLastPage = currentPageFloat >= lastPageIndex;
    const isPenultimatePage = currentPageFloat >= lastPageIndex - 1 && currentPageFloat < lastPageIndex;
    
    // Calcular valores: empezar a desvanecer en la penúltima página
    let targetOpacity = 1;
    let targetHeight = 1;
    let targetMarginTop = 16;
    if (isLastPage) {
      targetOpacity = 0;
      targetHeight = 0;
      targetMarginTop = 0;
    } else if (isPenultimatePage) {
      // Interpolar entre 1 y 0 mientras se desplaza de la penúltima a la última página
      const progress = (currentPageFloat - (lastPageIndex - 1));
      targetOpacity = Math.max(0, 1 - progress);
      targetHeight = Math.max(0, 1 - progress);
      targetMarginTop = Math.max(0, 16 * (1 - progress));
    }
    
    // Cancelar animaciones anteriores si existen
    if (opacityAnimationRef.current) {
      opacityAnimationRef.current.stop();
    }
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop();
    }
    
    // Para opacidad, usar animación rápida durante el scroll
    opacityAnimationRef.current = Animated.timing(skipButtonOpacity, {
      toValue: targetOpacity,
      duration: 100,
      useNativeDriver: true,
    });
    opacityAnimationRef.current.start(() => {
      opacityAnimationRef.current = null;
    });
    
    // Para height y marginTop, usar animación suave pero rápida
    scrollAnimationRef.current = Animated.parallel([
      Animated.timing(skipButtonHeight, {
        toValue: targetHeight,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(skipButtonMarginTop, {
        toValue: targetMarginTop,
        duration: 150,
        useNativeDriver: false,
      }),
    ]);
    scrollAnimationRef.current.start(() => {
      scrollAnimationRef.current = null;
    });
  };

  const goToNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    } else {
      onComplete();
    }
  };

  const goToPage = (page: number) => {
    scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
    setCurrentPage(page);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {onboardingData.map((item, index) => (
            <View
              key={index}
              className="flex-1 items-center justify-center px-8"
              style={{ width }}
            >
              <AnimatedView
                animationType="scale"
                delay={index * 100}
                duration={500}
              >
                <Text className="text-6xl mb-8">{item.icon}</Text>
              </AnimatedView>
              <AnimatedView
                animationType="slideUp"
                delay={index * 100 + 150}
                duration={500}
              >
                <Text className={`text-3xl font-bold text-center mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </Text>
              </AnimatedView>
              <AnimatedView
                animationType="fadeIn"
                delay={index * 100 + 300}
                duration={500}
              >
                <Text className={`text-lg text-center leading-7 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {item.description}
                </Text>
              </AnimatedView>
            </View>
        ))}
      </ScrollView>

      {/* Indicadores de página */}
      <View className="flex-row justify-center items-center mb-8">
        {onboardingData.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToPage(index)}
            className={`h-2 rounded-full mx-1 ${
              currentPage === index 
                ? 'bg-blue-600 w-8' 
                : isDark 
                  ? 'bg-gray-600 w-2' 
                  : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </View>

      {/* Botones */}
      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        {currentPage < onboardingData.length - 1 ? (
          <AnimatedButton onPress={goToNext}>
            <View className="bg-blue-600 py-4 rounded-lg items-center">
              <Text className="text-white text-lg font-semibold">Siguiente</Text>
            </View>
          </AnimatedButton>
        ) : (
          <AnimatedButton onPress={onComplete}>
            <View className="bg-blue-600 py-4 rounded-lg items-center">
              <Text className="text-white text-lg font-semibold">
                Comenzar
              </Text>
            </View>
          </AnimatedButton>
        )}
        {/* Contenedor para animaciones sin native driver (height, marginTop) */}
        <Animated.View
          style={{
            height: skipButtonHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 56], // altura aproximada del botón (py-4 = 16px arriba + 16px abajo + texto ~24px)
            }),
            marginTop: skipButtonMarginTop,
            overflow: 'hidden',
          }}
        >
          {/* Contenedor para animaciones con native driver (opacity) */}
          <Animated.View
            style={{
              opacity: skipButtonOpacity,
            }}
          >
            {currentPage < onboardingData.length - 1 && (
              <AnimatedButton onPress={onComplete}>
                <View className="py-4 rounded-lg items-center">
                  <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Saltar
                  </Text>
                </View>
              </AnimatedButton>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

