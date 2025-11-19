# Gesaccol

Aplicación móvil en **React Native + TypeScript** para la gestión integral de compañías, tareas personales y recordatorios fiscales. Gesaccol centraliza la información crítica, sincroniza notificaciones locales y ofrece herramientas visuales para priorizar vencimientos y compromisos.

## 🚀 Características principales
- Paneles de compañías con métricas clave (pendientes, vencidas, próximas) y filtros avanzados.
- Gestión de recordatorios con integración a canales de notificaciones locales usando `@notifee/react-native`.
- Calendarios empresariales configurables y sincronización automática de eventos.
- Módulo de tareas personales con recurrencias, prioridades, estados y alertas minuto a minuto.
- Experiencia adaptativa gracias al hook `useResponsive` y soporte total para modo claro/oscuro.
- Flujo de autenticación listo para Google Sign-In mediante `GOOGLE_WEB_CLIENT_ID`.

## 🧱 Stack y arquitectura
- **React Native 0.82 · React 19** usando componentes funcionales y hooks.
- **TypeScript** con tipados compartidos en `src/types`.
- **React Navigation (stack + bottom tabs)** para flujos multi-módulo.
- **NativeWind/TailwindCSS** para estilos responsivos declarativos.
- **Context API** (`AuthContext`, `ThemeContext`) para estado global.
- **Servicios HTTP organizados** en `src/services` para empresas, recordatorios, tareas y paneles.

## ✅ Requisitos previos
- Node.js >= 20 y npm (o pnpm/yarn) actualizados.
- JDK 17, Android Studio + Android SDK Platform 34.
- Xcode 15.4+ y CocoaPods (solo macOS/iOS).
- Dispositivo o emulador configurado, así como Watchman y Ruby Bundler opcionalmente.

## 🛠️ Configuración rápida
1. **Instala dependencias**
   ```bash
   npm install
   # ó
   pnpm install
   ```
2. **Configura variables de entorno**
   - Duplica `.env.example` (si aplica) o crea `.env`.
   - Define `GOOGLE_WEB_CLIENT_ID` (se usa en `src/config/env.ts`).
3. **Inicia Metro**
   ```bash
   npm start
   ```
4. **Ejecuta la app**
   ```bash
   npm run android
   npm run ios   # recuerda `bundle install && bundle exec pod install` la primera vez
   ```

## 📦 Scripts disponibles
- `npm start` · Inicia Metro.
- `npm run android` / `npm run ios` · Compila y despliega en el emulador/dispositivo.
- `npm run lint` · Ejecuta ESLint.
- `npm test` · Corre Jest.
- `npm run generate-icons` · Genera íconos adaptativos desde `scripts/generate-icons.js`.
- `npm run build:apk` · Empaqueta y copia un `Gesaccol-debug.apk` dentro de `releases/`.

## 🗂️ Estructura relevante
```
src/
 ├─ components/        # Animaciones, botones y modales reutilizables
 ├─ config/            # Env vars, tipos de calendario
 ├─ context/           # Tema y autenticación
 ├─ hooks/             # Hook de diseño responsivo
 ├─ navigation/        # Stack + tabs
 ├─ screens/           # Companies, Reminders, PersonalTasks, Dashboard…
 ├─ services/          # Llamadas HTTP y lógica de sincronización
 └─ types/             # Tipados compartidos
```

## 🔔 Notificaciones y recordatorios
- `notificationsService` crea canales en Android, solicita permisos y agenda recordatorios/tareas.
- `CompaniesScreen` y `PersonalTasksScreen` programan alertas al refrescar datos para mantener sincronía incluso fuera de la app.
- Ajusta los tiempos y textos de las notificaciones directamente en `src/services/notificationsService.ts`.

## 🧪 Pruebas
```bash
npm test
```
Las pruebas actuales utilizan Jest y `@testing-library/react-native`. Agrega specs en `__tests__/` o co-localizados según el módulo.

## 📲 Construir APK / IPA
- **Android**: `npm run build:apk` produce `releases/Gesaccol-debug.apk`.
- **iOS**: abre `ios/AppRecordatoriosMobile.xcworkspace` y genera el esquema `AppRecordatoriosMobile` desde Xcode (usar el mismo `GOOGLE_WEB_CLIENT_ID` en los entitlements correspondientes).
---
¿Preguntas o nuevas ideas? Abre un issue o empieza un PR. 👋
