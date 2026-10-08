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
- Node.js >= 20 y npm actualizados (el proyecto usa `package-lock.json`).
- JDK 17, Android Studio + Android SDK Platform 34.
- Xcode 15.4+ y CocoaPods (solo macOS/iOS).
- Dispositivo o emulador configurado, así como Watchman y Ruby Bundler opcionalmente.

## 🛠️ Configuración rápida
1. **Instala dependencias**
   ```bash
   npm install
   ```
2. **Revisa la configuración**
   - El Client ID de Google Sign-In está en `src/config/env.ts` y la URL de la API en `src/config/api.ts`.
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
- `npm run typecheck` · Comprueba los tipos con TypeScript (también se ejecuta en la CI).
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
- `NotificationSync` (`src/components/NotificationSync.tsx`) es el único punto que programa las notificaciones: observa los recordatorios y tareas de la caché y llama a `notificationsService.syncReminders` / `syncPersonalTasks`, que no reprograman nada si los datos no cambiaron.
- Los permisos solo se piden ante una acción del usuario (bienvenida, "Probar notificación", diagnóstico). Sin permiso, las notificaciones se programan igualmente y empiezan a mostrarse al concederlo.
- Al tocar una notificación se abre el recordatorio o la tarea correspondiente (`src/navigation/notificationNavigation.ts`). Los botones "Completar" y "Posponer 1 h" funcionan sin abrir la app (`src/services/notificationActions.ts`).
- Ajusta los tiempos y textos de las notificaciones directamente en `src/services/notificationsService.ts`.

## 🧪 Pruebas
```bash
npm test
```
Las pruebas actuales utilizan Jest y `@testing-library/react-native`. Agrega specs en `__tests__/` o co-localizados según el módulo.

## 📲 Construir APK / IPA
- **Android (pruebas)**: `npm run build:apk` produce `releases/Gesaccol-debug.apk`.
- **Android (Play Store)**: `cd android && ./gradlew bundleRelease` produce `.build/app/outputs/bundle/release/app-release.aab`, firmado con la clave de subida (ver abajo). Sin ella se firma con la clave de debug y Play Store lo rechaza.
- **iOS**: abre `ios/AppRecordatoriosMobile.xcworkspace` y genera el esquema `AppRecordatoriosMobile` desde Xcode (usar el mismo `GOOGLE_WEB_CLIENT_ID` en los entitlements correspondientes).

## 🔐 Firma de release (Android)
La firma se lee de cuatro variables, desde `~/.gradle/gradle.properties` (nunca en el repo) o desde el entorno:
`GESACCOL_UPLOAD_STORE_FILE`, `GESACCOL_UPLOAD_STORE_PASSWORD`, `GESACCOL_UPLOAD_KEY_ALIAS` y `GESACCOL_UPLOAD_KEY_PASSWORD`.

1. **Crea la clave de subida** (una sola vez):
   ```bash
   keytool -genkeypair -v -keystore gesaccol-upload.keystore -alias gesaccol      -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guárdala fuera del repositorio, con copia de seguridad y sus contraseñas en un gestor de contraseñas. Si se pierde, no podrás publicar actualizaciones (salvo pidiendo a Google que la restablezca con Play App Signing).
2. **Compilación local**: añade las cuatro variables a `~/.gradle/gradle.properties` con la ruta absoluta del `.keystore`.
3. **CI**: en GitHub → Settings → Secrets and variables → Actions, crea estos secrets:
   - `GESACCOL_UPLOAD_KEYSTORE_BASE64`: el archivo en base64 (`base64 -w0 gesaccol-upload.keystore`; en PowerShell, `[Convert]::ToBase64String([IO.File]::ReadAllBytes("gesaccol-upload.keystore"))`).
   - `GESACCOL_UPLOAD_STORE_PASSWORD`, `GESACCOL_UPLOAD_KEY_ALIAS`, `GESACCOL_UPLOAD_KEY_PASSWORD`.

   Con ellos, el workflow genera además el AAB firmado y lo deja como artefacto (`Gesaccol-android-aab-<tag>`) para subirlo a Play Console. Sin ellos, ese paso se omite.

## 🧭 Versionado y releases
Seguimos [SemVer](https://semver.org/lang/es/) (`MAJOR.MINOR.PATCH`):
- `package.json` marca la versión vigente; Android toma de ahí `versionName` y calcula `versionCode` (`MAJOR*10000 + MINOR*100 + PATCH`). Mantén `VERSION` igual.
- Documenta cambios en `CHANGELOG.md` bajo el bloque `Unreleased` y muévelos al crear una etiqueta.
- Flujo sugerido:
  1. Actualiza código y documentación.
  2. Edita `CHANGELOG.md` y `VERSION`/`package.json`.
  3. Commit `release: vX.Y.Z` y crea el tag `git tag vX.Y.Z`.
  4. Ejecuta los scripts de build (`npm run build:apk`, archivado iOS) y adjunta binarios en GitHub Releases.
- Reserva incrementos `MAJOR` para cambios incompatibles, `MINOR` para features visibles y `PATCH` para fixes sin breaking changes.
- El workflow `Mobile Release` en `.github/workflows/release.yml` se ejecuta al crear tags `v*.*.*`: corre lint, tipos y tests, genera el APK debug (y el AAB firmado si hay secrets), el build iOS para simulador, y adjunta el APK y el build iOS en GitHub Releases automáticamente.

---
¿Preguntas o nuevas ideas? Abre un issue o empieza un PR. 👋
