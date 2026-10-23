import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { City, Company } from '../../types';
import Button from '../Button';
import FilterChips from '../FilterChips';
import FormSheet, { FormField } from '../FormSheet';
import { cityIdFromKey, cityKey, cityOptions } from './cityOptions';

interface CityFormSheetProps {
  /** Empresa cuya ciudad se edita; null = hoja cerrada */
  company: Company | null;
  isDark: boolean;
  cities: City[];
  saving: boolean;
  onClose: () => void;
  /** Devuelve true si se guardó, para cerrar la hoja; si falla, sigue abierta */
  onSubmit: (company: Company, cityId: string | null) => Promise<boolean>;
}

/** Cambiar o quitar la ciudad de una empresa (y con ella sus calendarios municipales) */
export default function CityFormSheet({
  company,
  isDark,
  cities,
  saving,
  onClose,
  onSubmit,
}: CityFormSheetProps) {
  const [selected, setSelected] = useState(cityKey(company?.cityId));

  // Al abrir para otra empresa, partir de su ciudad actual
  useEffect(() => {
    setSelected(cityKey(company?.cityId));
  }, [company]);

  const unchanged = selected === cityKey(company?.cityId);

  const handleSubmit = async () => {
    if (!company || saving || unchanged) return;
    await onSubmit(company, cityIdFromKey(selected));
  };

  return (
    <FormSheet
      visible={company !== null}
      isDark={isDark}
      title="Ciudad"
      subtitle={company?.name}
      closeDisabled={saving}
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Cancelar"
              onPress={onClose}
              variant="secondary"
              size="large"
              disabled={saving}
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              label="Guardar ciudad"
              onPress={handleSubmit}
              size="large"
              busy={saving}
              disabled={unchanged}
              fullWidth
            />
          </View>
        </View>
      }
    >
      <FormField
        isDark={isDark}
        label="Ciudad"
        hint="Define qué calendarios municipales recibe. Al cambiarla se regeneran sus recordatorios."
      >
        <FilterChips
          isDark={isDark}
          options={cityOptions(cities)}
          selected={selected}
          onSelect={setSelected}
        />
      </FormField>
    </FormSheet>
  );
}
