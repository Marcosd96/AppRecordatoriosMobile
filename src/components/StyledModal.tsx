import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

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
  const modalSlideOffset = React.useMemo(
    () => responsive.scale(300),
    [responsive],
  );
  const slideAnim = React.useRef(new Animated.Value(modalSlideOffset)).current;
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
      slideAnim.setValue(modalSlideOffset);

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
          toValue: animationType === 'slide' ? modalSlideOffset : 0,
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
    modalSlideOffset,
    slideAnim,
    visible,
  ]);

  // No renderizar si no está visible y no hay animación
  if (!isModalVisible && !visible) {
    return null;
  }

  const getButtonStyle = (style?: 'default' | 'destructive' | 'cancel') => {
    if (style === 'destructive') {
      return {
        backgroundColor: isDark ? '#dc2626' : '#ef4444',
        textColor: '#ffffff',
      };
    }
    if (style === 'cancel') {
      return {
        backgroundColor: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#d1d5db' : '#374151',
      };
    }
    return {
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
    };
  };

  // Función para manejar el cierre con animación
  const handleClose = () => {
    if (!isAnimatingRef.current) {
      onClose();
    }
  };

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
      fontSize: responsive.fontSize['2xl'],
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
      borderTopWidth: 1,
    },
    buttonsRow: {
      flexDirection: responsive.isTablet ? 'row' : buttons && buttons.length > 2 ? 'column' : 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: responsive.spacing.sm,
    },
    button: {
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.sm,
      borderRadius: responsive.borderRadius.md,
      minWidth: responsive.isTablet ? 120 : 100,
      alignItems: 'center',
      flex: responsive.isTablet && buttons && buttons.length <= 2 ? 0 : buttons && buttons.length > 2 ? 1 : 0,
    },
    buttonText: {
      fontSize: responsive.fontSize.base,
      fontWeight: '600',
    },
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
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={dynamicStyles.contentContainer}>
                <Text
                  style={[
                    dynamicStyles.title,
                    { color: isDark ? '#ffffff' : '#111827' },
                  ]}
                >
                  {title}
                </Text>
                {message && (
                  <Text
                    style={[
                      dynamicStyles.message,
                      { color: isDark ? '#d1d5db' : '#4b5563' },
                    ]}
                  >
                    {message}
                  </Text>
                )}
                {children}
              </View>

              {buttons && buttons.length > 0 && (
                <View
                  style={[
                    dynamicStyles.buttonsContainer,
                    {
                      borderTopColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                >
                  <View style={dynamicStyles.buttonsRow}>
                    {buttons.map((button, index) => {
                      const buttonStyle = getButtonStyle(button.style);
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            if (!isAnimatingRef.current) {
                              button.onPress();
                              if (button.style !== 'cancel') {
                                handleClose();
                              }
                            }
                          }}
                          style={[
                            dynamicStyles.button,
                            {
                              backgroundColor: buttonStyle.backgroundColor,
                              marginLeft: index > 0 && !responsive.isTablet && buttons.length <= 2 ? responsive.spacing.sm : 0,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              dynamicStyles.buttonText,
                              {
                                color: buttonStyle.textColor,
                              },
                            ]}
                          >
                            {button.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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


