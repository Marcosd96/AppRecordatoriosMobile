/**
 * Herramientas de diagnóstico y prueba de notificaciones para una tarea personal.
 * Cada función devuelve el mensaje que la pantalla debe mostrar al usuario.
 */
import { PersonalTask } from '../../types';
import { notificationsService } from '../../services/notificationsService';
import { FormMessage } from './taskForm';

export async function diagnoseTaskNotification(task: PersonalTask): Promise<FormMessage> {
  try {
    // Obtener estado de notificaciones
    const status = await notificationsService.getNotificationStatus();
    const scheduledNotifications = await notificationsService.getScheduledNotifications();
    const nextNotification = await notificationsService.getNextNotification();

    // Calcular fecha de notificación esperada
    const taskDate = task.nextOccurrence || task.startDate;
    const expectedNotificationDate = new Date(taskDate);
    expectedNotificationDate.setMinutes(
      expectedNotificationDate.getMinutes() - (task.reminderMinutes || 60)
    );
    const now = new Date();
    const isInPast = expectedNotificationDate < now;

    // Buscar si esta tarea tiene notificación programada
    const taskNotification = scheduledNotifications.find(
      n => n.notification?.data?.taskId === task.id
    );

    let message = `📊 DIAGNÓSTICO DE NOTIFICACIONES\n\n`;
    message += `🔔 Estado general:\n`;
    message += `• Permisos: ${status.hasPermission ? '✅' : '❌'}\n`;
    message += `• Total programadas: ${status.scheduledCount}\n\n`;

    message += `📋 Tarea: "${task.title}"\n`;
    message += `• Fecha tarea: ${new Date(taskDate).toLocaleString('es-CO')}\n`;
    message += `• Recordatorio: ${task.reminderMinutes} min antes\n`;
    message += `• Fecha notificación esperada:\n  ${expectedNotificationDate.toLocaleString('es-CO')}\n`;
    message += `• Estado: ${isInPast ? '❌ YA PASÓ' : '✅ Futura'}\n\n`;

    if (taskNotification) {
      const trigger = taskNotification.trigger as any;
      const triggerDate = new Date(trigger.timestamp);
      const minutesUntil = Math.round((triggerDate.getTime() - now.getTime()) / 1000 / 60);
      const daysUntil = Math.round(minutesUntil / 60 / 24);

      message += `✅ Notificación programada:\n`;
      message += `• ID: ${taskNotification.notification?.id}\n`;
      message += `• Fecha: ${triggerDate.toLocaleString('es-CO')}\n`;

      if (daysUntil > 30) {
        message += `• ⚠️ En ${daysUntil} días (${Math.floor(daysUntil / 365)} años)\n`;
        message += `\n❌ PROBLEMA DETECTADO:\n`;
        message += `La notificación está programada para más de 30 días.\n`;
        message += `Probablemente el AÑO está incorrecto.\n\n`;
        message += `💡 Solución:\n`;
        message += `1. Edita la tarea\n`;
        message += `2. Verifica que el AÑO sea ${now.getFullYear()}\n`;
        message += `3. Guarda\n\n`;
      } else if (minutesUntil > 0) {
        message += `• En: ${minutesUntil} minutos`;
        if (daysUntil > 0) {
          message += ` (${daysUntil} días)`;
        }
        message += `\n\n`;
      } else {
        message += `• ❌ En el pasado (hace ${Math.abs(minutesUntil)} minutos)\n\n`;
      }
    } else {
      message += `❌ NO HAY NOTIFICACIÓN PROGRAMADA\n\n`;
      message += `Posibles causas:\n`;
      if (isInPast) {
        message += `• La fecha de notificación ya pasó\n`;
      }
      if (!status.hasPermission) {
        message += `• No hay permisos de notificación\n`;
      }
      message += `• La tarea se creó antes de tener permisos\n`;
      message += `\n💡 Solución: Edita la tarea y cambia la fecha a una futura\n`;
    }

    if (nextNotification.exists) {
      message += `\n⏰ Próxima notificación global:\n`;
      message += `• ${nextNotification.title}\n`;
      message += `• ${nextNotification.date?.toLocaleString('es-CO')}\n`;
    }

    return {
      title: '🔍 Diagnóstico de Notificaciones',
      message: message,
    };
  } catch (error: any) {
    console.error('Error en diagnóstico:', error);
    return {
      title: '❌ Error',
      message: `No se pudo completar el diagnóstico: ${error?.message}`,
    };
  }
}

export async function scheduleTaskTestNotification(task: PersonalTask): Promise<FormMessage> {
  try {
    // Verificar estado de notificaciones antes de programar
    const status = await notificationsService.getNotificationStatus();
    console.log('📊 Estado de notificaciones:', {
      hasPermission: status.hasPermission,
      scheduledCount: status.scheduledCount,
      authorizationStatus: status.authorizationStatus,
    });

    // Programar notificación de prueba (2 minutos)
    await notificationsService.scheduleTestNotificationForTask(task, 2);

    // Verificar que se programó
    const nextNotification = await notificationsService.getNextNotification();
    const notificationDetails = nextNotification.exists
      ? `\n\nPróxima notificación: ${nextNotification.title}\nFecha: ${nextNotification.date?.toLocaleString('es-CO')}`
      : '\n\n⚠️ No se encontró la notificación programada. Revisa los logs.';

    return {
      title: '✅ Notificación de prueba programada',
      message: `Recibirás una notificación en 2 minutos.${notificationDetails}\n\nRevisa la consola para más detalles.`,
    };
  } catch (error: any) {
    console.error('❌ Error al programar notificación de prueba:', error);
    return {
      title: '❌ Error',
      message: error?.message || 'No se pudo programar la notificación de prueba. Revisa los logs en la consola.',
    };
  }
}

export async function scheduleTaskQuickTestNotification(task: PersonalTask): Promise<FormMessage> {
  try {
    // Programar notificación en 10 segundos (10/60 minutos)
    await notificationsService.scheduleTestNotificationForTask(task, 10 / 60);

    return {
      title: '⚡ Notificación rápida programada',
      message: 'IMPORTANTE: Deberías ver una notificación INMEDIATA ahora. Si no la ves, minimiza la app (presiona el botón Home) y espera 10 segundos. La notificación programada llegará entonces.\n\nSi aún no ves notificaciones, verifica:\n1. Permisos de notificación en Configuración\n2. El canal "Tareas Personales" no está bloqueado\n3. Modo de ahorro de energía desactivado para esta app',
    };
  } catch (error: any) {
    console.error('❌ Error al programar notificación rápida:', error);
    return {
      title: '❌ Error',
      message: error?.message || 'No se pudo programar la notificación rápida.',
    };
  }
}

export async function rescheduleTaskNotification(task: PersonalTask): Promise<FormMessage> {
  try {
    const status = await notificationsService.getNotificationStatus();
    if (!status.hasPermission) {
      return {
        title: '⚠️ Sin permisos',
        message: 'Necesitas conceder permisos de notificación primero.',
      };
    }

    // Cancelar notificación existente y reprogramar
    await notificationsService.cancelPersonalTaskNotifications(task.id);
    await notificationsService.schedulePersonalTaskNotification(task);

    // Verificar que se programó
    const scheduledNotifications = await notificationsService.getScheduledNotifications();
    const taskNotification = scheduledNotifications.find(
      n => n.notification?.data?.taskId === task.id
    );

    if (taskNotification) {
      const trigger = taskNotification.trigger as any;
      const triggerDate = new Date(trigger.timestamp);
      const minutesUntil = Math.round((triggerDate.getTime() - Date.now()) / 1000 / 60);

      return {
        title: '✅ Notificación Reprogramada',
        message: `La notificación se ha reprogramado exitosamente.\n\n` +
          `📅 Tarea: ${new Date(task.nextOccurrence || task.startDate).toLocaleString('es-CO')}\n\n` +
          `🔔 Notificación programada para:\n${triggerDate.toLocaleString('es-CO')}\n\n` +
          `⏰ Llegará en ${minutesUntil} minutos.\n\n` +
          `💡 Minimiza la app para recibir la notificación.`,
      };
    }

    return {
      title: '⚠️ Advertencia',
      message: 'No se pudo verificar la notificación programada. ' +
        'Es posible que la fecha de la tarea ya haya pasado o que la fecha de ' +
        'notificación (tarea - recordatorio) esté en el pasado.\n\n' +
        'Edita la tarea y cambia la fecha a una futura.',
    };
  } catch (error: any) {
    console.error('Error al reprogramar:', error);
    return {
      title: '❌ Error',
      message: error?.message || 'No se pudo reprogramar la notificación.',
    };
  }
}
