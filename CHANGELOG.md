# Changelog

Todas las actualizaciones relevantes de Gesaccol se documentan aquí siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

## [1.1.4] - 2025-01-XX
### Corregido
- **Configuración de Android SDK en workflow**: Corregido formato de paquetes en `setup-android@v3`.
- Especificados paquetes directamente en lugar de usar variable multilínea que causaba errores de parsing.
- Workflow de CI ahora puede instalar correctamente `platform-tools`, `platforms;android-34` y `build-tools;34.0.0`.

## [1.1.3] - 2025-01-XX
### Corregido
- **Configuración de ESLint para Jest**: Resueltos errores de linting en archivos de Jest.
- Agregado entorno Jest en ESLint para reconocer globals (`jest`, `describe`, `it`, etc.).
- Override de reglas para archivos de Jest que deshabilita warnings de deep imports.
- Linting ahora pasa sin errores (solo warnings de inline styles que son aceptables en React Native).

## [1.1.2] - 2025-01-XX
### Corregido
- **Configuración de Jest para CI**: Tests ahora pasan correctamente en GitHub Actions.
- Agregados mocks para módulos nativos: `@notifee/react-native`, `react-native-gesture-handler`, `@react-native-google-signin/google-signin`, `@react-native-community/datetimepicker`.
- Mock de archivos CSS (Tailwind) para evitar errores de parsing en Jest.
- Configuración de `transformIgnorePatterns` para transformar módulos ESM correctamente.
- Setup de Jest con mocks globales para AsyncStorage y gesture-handler.

## [1.1.1] - 2025-11-19
### Corregido
- **⏰ Implementadas Alarmas Exactas**: Las notificaciones ahora llegan **exactamente** a la hora programada (0 segundos de retraso).
- Agregado `alarmManager: true` a todas las notificaciones para usar `AlarmManager` de Android.
- Eliminado retraso de ~4 minutos que causaba Android al agrupar notificaciones.
- Las notificaciones ahora funcionan correctamente en modo Doze y con optimización de batería desactivada.

### Detalles Técnicos
- Modificadas 3 funciones: `schedulePersonalTaskNotification()`, `scheduleTestNotificationForTask()`, `scheduleReminderNotification()`.
- Usa `AlarmManager.setExactAndAllowWhileIdle()` en Android 12+ (API 31+).
- Documentación completa en `ALARMAS_EXACTAS_IMPLEMENTADAS.md`.

## [1.1.0] - 2025-11-19
### Añadido
- **Selector de Fecha/Hora en Tareas Personales**: Ahora puedes seleccionar fecha y hora específicas al crear o editar tareas personales.
- Integración de `@react-native-community/datetimepicker` para selección nativa de fecha y hora.
- Validación automática para prevenir fechas pasadas.
- Hora inicial predeterminada a la próxima hora en punto (función `getNextRoundedHour()`).
- Botones separados para cambiar fecha y hora de manera independiente.
- Guía de uso completa en `GUIA_USO_SELECTOR_FECHA.md`.
- Instrucciones detalladas para actualizar el backend en `INSTRUCCIONES_BACKEND.md`.
- **Botones de Diagnóstico**: Agregados botones "🔍 Diagnosticar" y "🔄 Reprogramar" para facilitar troubleshooting de notificaciones.
- **Botones de Prueba**: "⚡ Prueba Rápida" (10 segundos) y "🔔 Probar Notif." (2 minutos) para verificar notificaciones.

### Cambiado
- El campo `startDate` en tareas personales ahora se configura a través de selectores de fecha/hora en lugar de usar la fecha actual.
- Mejorada la interfaz del formulario de tareas con mejor visualización de la fecha/hora seleccionada.
- La notificación ahora se programa correctamente basándose en la fecha/hora específica seleccionada.
- **Simplificado el código de notificaciones de tareas** para seguir el mismo patrón probado de recordatorios fiscales (reducción de ~45 líneas y 60% menos complejidad).

### Corregido
- **Conflicto crítico**: `scheduleAllReminders()` ya no cancela notificaciones de tareas personales, cada sistema maneja sus propias notificaciones independientemente.
- Problema donde las notificaciones no se programaban porque la fecha de notificación estaba en el pasado al usar la fecha actual como `startDate`.
- Mejor manejo de zonas horarias en la selección de fecha/hora.
- Eliminada cancelación individual redundante dentro de `schedulePersonalTaskNotification()` para mejor rendimiento.
- Eliminada lógica compleja de recurrencias client-side (ahora manejada por el backend).

## [1.0.0] - 2025-11-19
### Añadido
- README completamente reescrito en español con características, stack, scripts y pasos de build.
- Documentación de publicación de APK y guía de configuración de variables de entorno.
- Archivo `VERSION` para facilitar automatizaciones de release.
- Workflow de GitHub Actions `Mobile Release` que compila APK debug e iOS simulator build al crear tags.
- Publicación automática de artefactos en GitHub Releases desde el workflow.

### Cambiado
- `package.json` actualiza la versión inicial a `1.0.0` para reflejar el estado funcional del proyecto.

### Próximos pasos sugeridos
- Automatizar builds y releases con GitHub Actions.
- Añadir notas de cada módulo (Companies, Reminders, PersonalTasks) cuando reciban mejoras importantes.

[1.1.4]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.1.4
[1.1.3]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.1.3
[1.1.2]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.1.2
[1.1.1]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.1.1
[1.1.0]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.1.0
[1.0.0]: https://github.com/Marcosd96/AppRecordatoriosMobile/releases/tag/v1.0.0

