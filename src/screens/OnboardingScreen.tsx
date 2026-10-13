import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/Button';
import { AppLogo } from '../components/icons/BrandIcons';
import { BellIcon } from '../components/icons/ActionIcons';
import { CalendarIcon, CompaniesIcon } from '../components/icons/TabIcons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingIcon = 'logo' | 'companies' | 'bell' | 'calendar';

const onboardingData: { title: string; description: string; icon: OnboardingIcon }[] = [
  {
    title: 'Bienvenido a Gesaccol',
    description: 'Tu asistente para gestionar recordatorios fiscales de forma fácil y eficiente.',
    icon: 'logo',
  },
  {
    title: 'Gestiona tus empresas',
    description: 'Agrega y administra todas tus empresas con sus NIT y calendarios fiscales.',
    icon: 'companies',
  },
  {
    title: 'Recordatorios automáticos',
    description: 'Recibe avisos de tus obligaciones fiscales según los calendarios de la DIAN.',
    icon: 'bell',
  },
  {
    title: 'Todo en un solo lugar',
    description: 'Consulta tus recordatorios pendientes, vencidos y próximos de un vistazo.',
    icon: 'calendar',
  },
];

function PageIcon({ icon, isDark }: { icon: OnboardingIcon; isDark: boolean }) {
  if (icon === 'logo') {
    return <AppLogo size={112} />;
  }
  const color = isDark ? '#93c5fd' : '#2563eb';
  return (
    <View
      className={`h-28 w-28 rounded-3xl items-center justify-center ${
        isDark ? 'bg-blue-500/15' : 'bg-blue-50'
      }`}
    >
      {icon === 'companies' && <CompaniesIcon color={color} size={52} />}
      {icon === 'bell' && <BellIcon color={color} size={52} />}
      {icon === 'calendar' && <CalendarIcon color={color} size={52} />}
    </View>
  );
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isLastPage = currentPage === onboardingData.length - 1;

  // La página se fija al terminar el desplazamiento: no hace falta recalcular en cada frame
  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCurrentPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const goToPage = (page: number) => {
    scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
    setCurrentPage(page);
  };

  const goToNext = () => {
    if (isLastPage) {
      onComplete();
    } else {
      goToPage(currentPage + 1);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* "Saltar" arriba: siempre en el mismo sitio y sin mover el resto */}
      <View className="flex-row justify-end px-4 h-12 items-center">
        {!isLastPage && (
          <Button label="Saltar" onPress={onComplete} variant="text" />
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        className="flex-1"
      >
        {onboardingData.map(item => (
          <View
            key={item.title}
            className="flex-1 items-center justify-center px-8"
            style={{ width }}
          >
            <View className="mb-10">
              <PageIcon icon={item.icon} isDark={isDark} />
            </View>
            <Text
              accessibilityRole="header"
              className={`text-3xl font-bold text-center mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {item.title}
            </Text>
            <Text
              className={`text-lg text-center leading-7 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
              style={styles.description}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores de página */}
      <View className="flex-row justify-center items-center mb-8">
        {onboardingData.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            onPress={() => goToPage(index)}
            accessibilityRole="button"
            accessibilityLabel={`Página ${index + 1} de ${onboardingData.length}`}
            accessibilityState={{ selected: currentPage === index }}
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
            className="mx-1"
          >
            <View
              className={`h-2 rounded-full ${
                currentPage === index
                  ? 'bg-blue-600 w-8'
                  : isDark
                  ? 'bg-gray-700 w-2'
                  : 'bg-gray-300 w-2'
              }`}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View className="px-8 pb-8">
        <Button
          label={isLastPage ? 'Comenzar' : 'Siguiente'}
          onPress={goToNext}
          size="large"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  description: { maxWidth: 420 },
});
