import React, { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import { City } from '../../types';
import Button from '../Button';
import FilterChips from '../FilterChips';
import FormSheet, { FormField, inputClassName, placeholderColor } from '../FormSheet';
import { NO_CITY_KEY, cityIdFromKey, cityOptions } from './cityOptions';

interface AddCompanyModalProps {
  visible: boolean;
  isDark: boolean;
  creating: boolean;
  /** Catálogo de ciudades; si está vacío, el campo no se muestra */
  cities: City[];
  onClose: () => void;
  /** Devuelve true si la empresa se creó, para limpiar el formulario */
  onSubmit: (name: string, nit: string, cityId: string | null) => Promise<boolean>;
}

export default function AddCompanyModal({
  visible,
  isDark,
  creating,
  cities,
  onClose,
  onSubmit,
}: AddCompanyModalProps) {
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [cityKey, setCityKey] = useState(NO_CITY_KEY);
  const nitInputRef = useRef<TextInput>(null);

  const isValid = name.trim().length > 0 && nit.trim().length > 0;
  const submitDisabled = creating || !isValid;

  const resetForm = () => {
    setName('');
    setNit('');
    setCityKey(NO_CITY_KEY);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (submitDisabled) return;
    if (await onSubmit(name.trim(), nit.trim(), cityIdFromKey(cityKey))) {
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
          <View className="flex-1">
            <Button
              label="Cancelar"
              onPress={handleClose}
              variant="secondary"
              size="large"
              disabled={creating}
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              label="Crear empresa"
              onPress={handleSubmit}
              size="large"
              busy={creating}
              disabled={!isValid}
              fullWidth
            />
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

      {cities.length > 0 && (
        <FormField
          isDark={isDark}
          label="Ciudad"
          optional
          hint="Define qué calendarios municipales puede recibir."
        >
          <FilterChips
            isDark={isDark}
            options={cityOptions(cities)}
            selected={cityKey}
            onSelect={setCityKey}
          />
        </FormField>
      )}
    </FormSheet>
  );
}
