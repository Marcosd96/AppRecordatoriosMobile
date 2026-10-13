import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ThemePreference, useTheme } from '../context/ThemeContext';
import { useNotificationStatus } from '../hooks/useNotificationStatus';
import ListRow from '../components/ListRow';
import SegmentedControl from '../components/SegmentedControl';
import StackHeader from '../components/StackHeader';
import StyledModal from '../components/StyledModal';
import { RootStackScreenProps } from '../navigation/types';
import { version as appVersion } from '../../package.json';

const themeOptions: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'Sistema' },
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <View style={styles.group}>
      <Text
        accessibilityRole="header"
        className={`px-1 mb-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {title}
      </Text>
      <View
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Ajustes poco frecuentes que antes ocupaban Inicio: tema, estado de las notificaciones,
 * cuenta y versión.
 */
export default function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const { isDark, preference, setPreference } = useTheme();
  const { user, signOut } = useAuth();
  const { status } = useNotificationStatus();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const notificationSummary = !status
    ? 'Comprobando…'
    : status.hasPermission
    ? `Activadas · ${status.scheduledCount} programada${status.scheduledCount === 1 ? '' : 's'}`
    : 'Sin permiso: no recibirás los recordatorios';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StackHeader title="Ajustes" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Group title="Apariencia">
          <View className="p-4">
            <SegmentedControl
              isDark={isDark}
              options={themeOptions}
              selected={preference}
              onSelect={setPreference}
            />
            <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {preference === 'system'
                ? 'Se ajusta al tema claro u oscuro de tu dispositivo.'
                : 'Se mantiene aunque cambie el tema del dispositivo.'}
            </Text>
          </View>
        </Group>

        <Group title="Notificaciones">
          <ListRow
            title="Estado de las notificaciones"
            subtitle={notificationSummary}
            onPress={() => navigation.navigate('NotificationTroubleshooting')}
            accessibilityHint="Abre el diagnóstico de notificaciones"
          />
        </Group>

        <Group title="Cuenta">
          {user ? (
            <ListRow title={user.name || user.email} subtitle={user.name ? user.email : undefined} />
          ) : null}
          <ListRow
            title="Cerrar sesión"
            destructive
            divider={!!user}
            onPress={() => setConfirmSignOut(true)}
          />
        </Group>

        <Group title="Acerca de">
          <ListRow
            title="Versión"
            trailing={
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {appVersion}
              </Text>
            }
          />
        </Group>
      </ScrollView>

      <StyledModal
        visible={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Cerrar sesión"
        message="Tendrás que volver a iniciar sesión con Google. Tus datos se conservan en el servidor."
        buttons={[
          { text: 'Cancelar', style: 'cancel', onPress: () => setConfirmSignOut(false) },
          { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  group: { marginBottom: 24 },
});
