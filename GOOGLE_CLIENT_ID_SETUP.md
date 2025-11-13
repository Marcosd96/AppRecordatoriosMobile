# Configuración de Google Client ID

## 🔑 Obtener tu Google Web Client ID

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **APIs & Services** > **Credentials**
4. Busca tu **OAuth 2.0 Client ID** de tipo **Web application**
5. Copia el **Client ID** (tiene el formato: `xxxxx.apps.googleusercontent.com`)

## 📝 Configurar en la App Móvil

1. Abre el archivo: `src/config/env.ts`
2. Reemplaza `'TU_GOOGLE_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com'` con tu Client ID real:

```typescript
export const GOOGLE_WEB_CLIENT_ID = 
  'tu-client-id-real.apps.googleusercontent.com';
```

## ⚠️ Importante

- **NO** uses el mismo Client ID que tienes en Next.js si es solo para web
- Necesitas crear un **OAuth 2.0 Client ID** de tipo **Web application** en Google Cloud Console
- Este Client ID debe estar en el mismo proyecto de Google Cloud que tu app Next.js
- El Client ID debe tener habilitado el acceso a la API de Google Sign-In

## 🔍 Verificar Configuración

Después de configurar el Client ID:
1. Reinicia Metro bundler: `pnpm exec react-native start --reset-cache`
2. Reconstruye la app: `pnpm exec react-native run-android`

Si ves el error "RNGoogleSignin: offline use requires server web ClientID", significa que el Client ID no está configurado correctamente.

