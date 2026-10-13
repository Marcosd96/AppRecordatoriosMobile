import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import Button, { ButtonVariant } from './Button';

interface StyledModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'destructive' | 'cancel';
  }>;
  children?: React.ReactNode;
  animationType?: 'fade' | 'slide';
}

const buttonVariants: Record<'default' | 'destructive' | 'cancel', ButtonVariant> = {
  default: 'filled',
  destructive: 'destructive',
  cancel: 'secondary',
};

// Distancia desde la que entra el diálogo al animarse
const MODAL_SLIDE_OFFSET = 300;

export default function StyledModal({
  visible,
  onClose,
  title,
  message,
  buttons,
  children,
  animationType = 'fade',
}: StyledModalProps) {
  const { isDark } = useTheme();
  const responsive = useResponsive();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(MODAL_SLIDE_OFFSET)).current;
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const isAnimatingRef = React.useRef(false);

  React.useEffect(() => {
    // Cancelar animaciones anteriores si existen
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (visible) {
      // Mostrar el modal y ejecutar animación de entrada
      setIsModalVisible(true);
      isAnimatingRef.current = true;
      
      // Reiniciar valores antes de animar
      fadeAnim.setValue(0);
      slideAnim.setValue(MODAL_SLIDE_OFFSET);

      // Pequeño delay para asegurar que los valores se han establecido
      const timer = setTimeout(() => {
        animationRef.current = Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
        ]);
        animationRef.current.start(() => {
          animationRef.current = null;
          isAnimatingRef.current = false;
        });
      }, 10);

      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      };
    } else if (isModalVisible) {
      // Ejecutar animación de salida y luego ocultar el modal
      isAnimatingRef.current = true;
      
      animationRef.current = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: animationType === 'slide' ? MODAL_SLIDE_OFFSET : 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]);
      
      animationRef.current.start(({ finished }) => {
        if (finished) {
          setIsModalVisible(false);
          isAnimatingRef.current = false;
        }
        animationRef.current = null;
      });
    }
  }, [
    animationType,
    fadeAnim,
    isModalVisible,
    slideAnim,
    visible,
  ]);

  // No renderizar si no está visible y no hay animación
  if (!isModalVisible && !visible) {
    return null;
  }

  // Función para manejar el cierre con animación
  const handleClose = () => {
    if (!isAnimatingRef.current) {
      onClose();
    }
  };

  const stackButtons = !!buttons && buttons.length > 2;
  const palette = isDark ? themeStyles.dark : themeStyles.light;

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing.md,
    },
    modalContainer: {
      width: responsive.isTablet ? '80%' : '90%',
      maxWidth: responsive.isTablet ? 500 : 400,
      maxHeight: '90%',
      borderRadius: responsive.borderRadius.xl,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    contentContainer: {
      paddingHorizontal: responsive.spacing.lg,
      paddingTop: responsive.spacing.lg,
      paddingBottom: responsive.spacing.md,
    },
    title: {
      fontSize: responsive.fontSize.xl,
      fontWeight: '700',
      marginBottom: responsive.spacing.sm,
    },
    message: {
      fontSize: responsive.fontSize.base,
      lineHeight: responsive.fontSize.base * 1.5,
    },
    buttonsContainer: {
      paddingHorizontal: responsive.spacing.lg,
      paddingBottom: responsive.spacing.lg,
      paddingTop: responsive.spacing.sm,
    },
    // Con 1-2 botones van en fila y con el mismo ancho; con más, apilados a lo ancho
    buttonsRow: {
      flexDirection: stackButtons ? 'column' : 'row',
      gap: responsive.spacing.sm,
    },
    buttonSlot: { flex: 1 },
  });

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            dynamicStyles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                dynamicStyles.modalContainer,
                palette.container,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={dynamicStyles.contentContainer}>
                <Text
                  accessibilityRole="header"
                  style={[
                    dynamicStyles.title,
                    palette.title,
                  ]}
                >
                  {title}
                </Text>
                {message && (
                  <Text
                    style={[
                      dynamicStyles.message,
                      palette.message,
                    ]}
                  >
                    {message}
                  </Text>
                )}
                {children}
              </View>

              {buttons && buttons.length > 0 && (
                <View style={dynamicStyles.buttonsContainer}>
                  <View style={dynamicStyles.buttonsRow}>
                    {buttons.map((button, index) => (
                      <View key={index} style={stackButtons ? undefined : dynamicStyles.buttonSlot}>
                        <Button
                          label={button.text}
                          variant={buttonVariants[button.style ?? 'default']}
                          size="large"
                          fullWidth
                          onPress={() => {
                            if (!isAnimatingRef.current) {
                              button.onPress();
                              if (button.style !== 'cancel') {
                                handleClose();
                              }
                            }
                          }}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Colores del modal según el tema
const themeStyles = {
  light: StyleSheet.create({
    container: { backgroundColor: '#ffffff' },
    title: { color: '#111827' },
    message: { color: '#4b5563' },
  }),
  dark: StyleSheet.create({
    container: { backgroundColor: '#1f2937' },
    title: { color: '#ffffff' },
    message: { color: '#d1d5db' },
  }),
};
