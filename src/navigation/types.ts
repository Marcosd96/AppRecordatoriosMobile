import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ReminderFilter } from '../types';

/**
 * Pantallas y parámetros de la navegación. Con estos tipos, un nombre de pantalla mal escrito
 * o un parámetro que falta es un error de compilación.
 */

export type MainTabParamList = {
  Dashboard: undefined;
  /** taskId + highlightAt: ir a una tarea y resaltarla (notificaciones, búsqueda, widget) */
  PersonalTasks: { taskId?: string; highlightAt?: number } | undefined;
  Reminders:
    | {
        reminderId?: string;
        highlightAt?: number;
        companyId?: string;
        filter?: ReminderFilter;
      }
    | undefined;
  Companies: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  WelcomePermissions: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  NotificationTroubleshooting: undefined;
  Search: undefined;
  History: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

/** Pantallas de las pestañas: pueden navegar tanto entre pestañas como a las del stack */
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  StackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
