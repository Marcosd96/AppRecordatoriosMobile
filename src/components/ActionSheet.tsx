import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../theme/colors';

export interface SheetAction {
  key: string;
  label: string;
  onPress: () => void;
  /** Acción que borra o anula: se muestra en rojo */
  destructive?: boolean;
}

export interface SheetActionGroup {
  /** Título opcional del grupo (p. ej. "Diagnóstico del aviso") */
  title?: string;
  actions: SheetAction[];
}

interface ActionSheetProps {
  visible: boolean;
  /** Elemento al que se refieren las acciones */
  title: string;
  groups: SheetActionGroup[];
  onClose: () => void;
}

// La acción se ejecuta cuando la hoja ha terminado de cerrarse: así un diálogo que abra
// (p. ej. confirmar eliminación) no se superpone a la hoja que se está cerrando
const RUN_AFTER_CLOSE_MS = 300;

/**
 * Hoja inferior con las acciones secundarias de un elemento (M3 *modal bottom sheet*).
 * Se cierra con Atrás, tocando fuera o al elegir una acción.
 */
export default function ActionSheet({ visible, title, groups, onClose }: ActionSheetProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const select = (action: SheetAction) => {
    onClose();
    setTimeout(action.onPress, RUN_AFTER_CLOSE_MS);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          style={StyleSheet.absoluteFill}
          className="bg-black/50"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View
          accessibilityViewIsModal
          className={`w-full self-center rounded-t-3xl pt-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}
        >
          <View className="items-center mb-2">
            <View className={`h-1 w-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          </View>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            className={`px-6 pt-2 pb-3 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {title}
          </Text>

          {groups
            .filter(group => group.actions.length > 0)
            .map((group, index) => (
              <View
                key={group.title ?? index}
                className={index > 0 ? `mt-1 pt-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}` : ''}
              >
                {group.title ? (
                  <Text className={`px-6 pt-3 pb-1 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {group.title}
                  </Text>
                ) : null}
                {group.actions.map(action => (
                  <Pressable
                    key={action.key}
                    onPress={() => select(action)}
                    accessibilityRole="button"
                    android_ripple={{ color: colors.ripple }}
                    className="min-h-14 px-6 justify-center"
                  >
                    <Text
                      className={`text-base ${
                        action.destructive
                          ? isDark ? 'text-red-300' : 'text-red-600'
                          : isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // En pantallas anchas la hoja no ocupa todo el ancho
  sheet: { maxWidth: 640 },
});
