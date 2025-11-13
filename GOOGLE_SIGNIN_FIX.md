# Solución para Error DEVELOPER_ERROR en Google Sign-In

## 🔍 Problema

El error `DEVELOPER_ERROR` ocurre cuando Google Sign-In no puede verificar tu aplicación Android porque falta el SHA-1 fingerprint en Google Cloud Console.

## ✅ Solución

### Paso 1: Obtener SHA-1 Fingerprint

Ya obtuvimos tu SHA-1 fingerprint:

**SHA-1 (Debug):** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### Paso 2: Configurar en Google Cloud Console

**⚠️ IMPORTANTE:** Necesitas crear un **Client ID de tipo Android**, NO usar el de Web Application.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (el mismo que usas para tu app web)
3. Ve a **APIs & Services** > **Credentials**
4. En la parte superior, haz clic en **+ CREAR CREDENCIALES** > **ID de cliente de OAuth**
5. Selecciona **Android** como tipo de aplicación
6. Completa los campos:
   - **Nombre:** `AppRecordatoriosMobile Android` (o el nombre que prefieras)
   - **Nombre del paquete:** `com.apprecordatoriosmobile`
   - **SHA-1 certificate fingerprint:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
7. Haz clic en **CREAR**

**Si ya tienes un Client ID de Android:**
- Haz clic en el Client ID de Android en la lista
- En la sección **SHA-1 certificate fingerprints**, haz clic en **+ Agregar huella digital SHA-1**
- Pega el SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- Guarda los cambios

### Paso 3: Verificar Package Name

Asegúrate de que el **Package name** en Google Cloud Console coincida con tu aplicación:

**Package name:** `com.apprecordatoriosmobile`

Puedes encontrarlo en:
- `android/app/build.gradle` → `applicationId "com.apprecordatoriosmobile"`

### Paso 4: Verificar Web Client ID

Tu Web Client ID actual es:
```
559109517807-eqnn0u1tpumaij33uv1270ss33rls7j6.apps.googleusercontent.com
```

Este debe estar configurado en `src/config/env.ts` (ya está configurado).

### Paso 5: Reiniciar la App

Después de configurar el SHA-1 en Google Cloud Console:

1. **Espera 5-10 minutos** para que los cambios se propaguen
2. Cierra completamente la app en tu dispositivo
3. Reconstruye la app:
   ```bash
   npm run android
   ```

## ⚠️ Notas Importantes

1. **Tiempo de propagación**: Los cambios en Google Cloud Console pueden tardar hasta 10 minutos en aplicarse.

2. **SHA-1 para Release**: Cuando generes una versión de producción, necesitarás agregar el SHA-1 del keystore de producción también.

3. **Mismo proyecto**: Asegúrate de usar el mismo proyecto de Google Cloud Console para:
   - Web Client ID (Next.js)
   - Android Client ID (React Native)

## 🔍 Verificar Configuración

Si después de seguir estos pasos aún tienes el error:

1. Verifica que el SHA-1 esté correctamente copiado (sin espacios extra)
2. Verifica que el Package name coincida exactamente
3. Espera más tiempo (hasta 30 minutos en algunos casos)
4. Verifica que el Web Client ID sea correcto en `src/config/env.ts`

## 📝 Resumen de Configuración Actual

- **Package Name:** `com.apprecordatoriosmobile`
- **SHA-1 (Debug):** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **Web Client ID:** `559109517807-eqnn0u1tpumaij33uv1270ss33rls7j6.apps.googleusercontent.com`

