import React, { useRef, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import AnimatedButton from '../AnimatedButton';
import FormSheet, { FormField, inputClassName, placeholderColor } from '../FormSheet';

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
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const nitInputRef = useRef<TextInput>(null);

  const isValid = name.trim().length > 0 && nit.trim().length > 0;
  const submitDisabled = creating || !isValid;

  const resetForm = () => {
    setName('');
    setNit('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (submitDisabled) return;
    if (await onSubmit(name.trim(), nit.trim())) {
      resetForm();
    }
  };

  return (
    <FormSheet
      visible={visible}
      isDark={isDark}
      title="Nueva empresa"
      subtitle="Generaremos sus recordatorios fiscales automáticamente"
      closeDisabled={creating}
      onClose={handleClose}
      footer={
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleClose}
            disabled={creating}
            accessibilityRole="button"
            className={`flex-1 py-3.5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <View className="flex-1">
            <AnimatedButton
              onPress={handleSubmit}
              disabled={submitDisabled}
              accessibilityState={{ disabled: submitDisabled, busy: creating }}
            >
              <View className={`py-3.5 rounded-xl bg-blue-600 ${submitDisabled ? 'opacity-50' : ''}`}>
                {creating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-semibold">Crear empresa</Text>
                )}
              </View>
            </AnimatedButton>
          </View>
        </View>
      }
    >
      <FormField isDark={isDark} label="Nombre comercial" required>
        <TextInput
          className={inputClassName(isDark)}
          placeholder="Ej: Mi Empresa S.A.S."
          placeholderTextColor={placeholderColor(isDark)}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => nitInputRef.current?.focus()}
          submitBehavior="submit"
        />
      </FormField>

      <FormField isDark={isDark} label="NIT" required>
        <TextInput
          ref={nitInputRef}
          className={inputClassName(isDark)}
          placeholder="Ej: 900123456-7"
          placeholderTextColor={placeholderColor(isDark)}
          value={nit}
          onChangeText={setNit}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </FormField>
    </FormSheet>
  );
}
