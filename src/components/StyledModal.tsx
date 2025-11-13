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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;
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
      slideAnim.setValue(300);

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
          toValue: 300,
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
  }, [visible]);

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
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.contentContainer}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#ffffff' : '#111827' },
                  ]}
                >
                  {title}
                </Text>
                {message && (
                  <Text
                    style={[
                      styles.message,
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
                    styles.buttonsContainer,
                    {
                      borderTopColor: isDark ? '#374151' : '#e5e7eb',
                    },
                  ]}
                >
                  <View style={styles.buttonsRow}>
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
                            styles.button,
                            {
                              backgroundColor: buttonStyle.backgroundColor,
                              marginLeft: index > 0 ? 12 : 0,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.buttonText,
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

