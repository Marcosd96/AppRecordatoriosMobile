import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
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
    <SafeAreaView className="flex-1 bg-white">
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
            <Text className="text-6xl mb-8">{item.icon}</Text>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
              {item.title}
            </Text>
            <Text className="text-lg text-gray-600 text-center leading-7">
              {item.description}
            </Text>
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
              currentPage === index ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </View>

      {/* Botones */}
      <View className="px-8 pb-8">
        {currentPage < onboardingData.length - 1 ? (
          <TouchableOpacity
            onPress={goToNext}
            className="bg-blue-600 py-4 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-semibold">Siguiente</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onComplete}
            className="bg-blue-600 py-4 rounded-lg items-center"
          >
            <Text className="text-white text-lg font-semibold">
              Comenzar
            </Text>
          </TouchableOpacity>
        )}
        {currentPage > 0 && (
          <TouchableOpacity
            onPress={() => goToPage(0)}
            className="mt-4 py-4 rounded-lg items-center"
          >
            <Text className="text-gray-600 text-lg">Saltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

