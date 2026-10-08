import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AnimatedView from '../AnimatedView';
import AnimatedButton from '../AnimatedButton';
import { useResponsive } from '../../hooks/useResponsive';

interface AddCompanyModalProps {
  visible: boolean;
  isDark: boolean;
  creating: boolean;
  onClose: () => void;
  /** Devuelve true si la empresa se creó, para limpiar el formulario */
  onSubmit: (name: string, nit: string) => Promise<boolean>;
}

export default function AddCompanyModal({
  visible,
  isDark,
  creating,
  onClose,
  onSubmit,
}: AddCompanyModalProps) {
  const responsive = useResponsive();
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');

  const isValid = name.trim().length > 0 && nit.trim().length > 0;

  const modalLayout = useMemo(() => {
    const modalMaxHeight =
      responsive.height *
      (responsive.isTablet ? 0.85 : responsive.isSmallDevice ? 0.95 : 0.9);
    const modalMaxWidth = responsive.isTablet
      ? Math.min(responsive.width * 0.8, 720)
      : responsive.width;
    const reservedHeaderSpace = responsive.isSmallDevice
      ? responsive.spacing['2xl']
      : responsive.spacing['3xl'];

    return {
      maxHeight: modalMaxHeight,
      maxWidth: modalMaxWidth,
      contentMaxHeight: Math.max(
        modalMaxHeight - reservedHeaderSpace,
        responsive.verticalScale(320),
      ),
      horizontalPadding: responsive.isTablet
        ? responsive.spacing.xl
        : responsive.spacing.sm,
      justifyContent: responsive.isTablet ? 'center' : 'flex-end',
      borderRadiusClass: responsive.isTablet ? 'rounded-3xl' : 'rounded-t-3xl',
    };
  }, [responsive]);

  const resetForm = () => {
    setName('');
    setNit('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (await onSubmit(name.trim(), nit.trim())) {
      resetForm();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 bg-black/60"
          style={{
            justifyContent: modalLayout.justifyContent as
              | 'center'
              | 'flex-end',
            paddingHorizontal: modalLayout.horizontalPadding,
            paddingBottom: responsive.isTablet ? responsive.spacing.xl : 0,
          }}
        >
          <View
            className={`${modalLayout.borderRadiusClass} ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            style={{
              maxHeight: modalLayout.maxHeight,
              width: '100%',
              maxWidth: modalLayout.maxWidth,
              alignSelf: 'center',
            }}
          >
            <AnimatedView animationType="slideDown" delay={0} duration={400}>
              <View className="px-6 pt-6 pb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-2">
                      <View
                        className={`h-10 w-10 rounded-2xl items-center justify-center mr-3 ${
                          isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}
                      >
                        <Text className="text-xl">🏢</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-2xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          Nueva empresa
                        </Text>
                        <Text
                          className={`text-sm mt-0.5 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          Crea una empresa para generar recordatorios
                          automáticos
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={creating}
                    className={`h-10 w-10 rounded-xl items-center justify-center ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <Text className="text-lg">✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedView>

            <ScrollView
              style={{ maxHeight: modalLayout.contentMaxHeight }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: responsive.spacing.lg }}
            >
              <View
                className="space-y-6"
                style={{ paddingHorizontal: responsive.spacing.lg }}
              >
                <AnimatedView
                  animationType="fadeIn"
                  delay={100}
                  duration={400}
                >
                  <View
                    className={`rounded-3xl p-5 border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-base font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      📝 Información de la empresa
                    </Text>

                    <View className="mb-4">
                      <Text
                        className={`text-sm font-semibold mb-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Nombre comercial
                        <Text className="text-red-500"> *</Text>
                      </Text>
                      <TextInput
                        className={`border-2 rounded-2xl px-4 py-3.5 ${
                          isDark
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ej: Mi Empresa S.A.S."
                        placeholderTextColor={
                          isDark ? '#6b7280' : '#9ca3af'
                        }
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    <View>
                      <Text
                        className={`text-sm font-semibold mb-2 ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        NIT
                        <Text className="text-red-500"> *</Text>
                      </Text>
                      <TextInput
                        className={`border-2 rounded-2xl px-4 py-3.5 ${
                          isDark
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Ej: 900123456-7"
                        placeholderTextColor={
                          isDark ? '#6b7280' : '#9ca3af'
                        }
                        value={nit}
                        onChangeText={setNit}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </AnimatedView>

                <AnimatedView
                  animationType="fadeIn"
                  delay={200}
                  duration={400}
                >
                  <View
                    className={`rounded-3xl p-5 border ${
                      isDark
                        ? 'bg-blue-900/20 border-blue-800/40'
                        : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <Text
                      className={`text-base font-bold mb-2 ${
                        isDark ? 'text-blue-100' : 'text-blue-800'
                      }`}
                    >
                      💡 Recordatorios inteligentes
                    </Text>
                    <Text
                      className={`text-sm ${
                        isDark ? 'text-blue-100/80' : 'text-blue-800'
                      }`}
                    >
                      Al guardar la empresa, generaremos automáticamente los
                      recordatorios fiscales según los calendarios DIAN. Luego
                      podrás personalizarlos.
                    </Text>
                  </View>
                </AnimatedView>

                <AnimatedView
                  animationType="fadeIn"
                  delay={300}
                  duration={400}
                >
                  <View className="pt-2 pb-6">
                    <AnimatedButton
                      onPress={handleSubmit}
                      disabled={creating || !isValid}
                    >
                      <View
                        className={`py-4 rounded-2xl ${
                          creating || !isValid
                            ? 'bg-blue-400/70'
                            : 'bg-blue-600'
                        } shadow-lg`}
                      >
                        {creating ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text className="text-white text-center font-bold text-base">
                            ✨ Crear empresa
                          </Text>
                        )}
                      </View>
                    </AnimatedButton>

                    <TouchableOpacity
                      onPress={handleClose}
                      disabled={creating}
                      className="mt-3 py-3 rounded-2xl"
                      style={{
                        backgroundColor: isDark ? '#111827' : '#f3f4f6',
                      }}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedView>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
