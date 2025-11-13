# Configuración de Autenticación Móvil

## 📋 Requisitos

1. **Google Cloud Console Setup:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto o usa el existente
   - Habilita la API de Google Sign-In
   - Crea credenciales OAuth 2.0:
     - **Web Client ID** (ya lo tienes para Next.js)
     - **Android Client ID** (necesario para la app móvil)

2. **Configurar Android Client ID:**
   - En Google Cloud Console, crea credenciales OAuth 2.0 para Android
   - Necesitarás el SHA-1 fingerprint de tu app Android
   - Para obtenerlo:
     ```bash
     # Windows
     cd android && gradlew signingReport
     
     # Mac/Linux
     cd android && ./gradlew signingReport
     ```
   - Copia el SHA-1 y agrégalo en Google Cloud Console

## 🔧 Configuración en la App Móvil

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz de `AppRecordatoriosMobile`:

```env
GOOGLE_WEB_CLIENT_ID=tu-web-client-id.apps.googleusercontent.com
```

**Nota:** Usa el mismo `GOOGLE_CLIENT_ID` que tienes en tu proyecto Next.js.

### 2. Configurar Google Sign-In

El código ya está configurado en `src/context/AuthContext.tsx`. Solo necesitas:

1. Agregar la variable de entorno `GOOGLE_WEB_CLIENT_ID`
2. Configurar el Android Client ID en Google Cloud Console

### 3. Configurar AndroidManifest.xml

Ya está configurado con permisos de internet. Si necesitas más configuración, edita:
`android/app/src/main/AndroidManifest.xml`

## 🚀 Flujo de Autenticación

1. Usuario abre la app
2. Si no está autenticado → Pantalla de Login
3. Usuario hace clic en "Continuar con Google"
4. Se abre el flujo de Google Sign-In
5. Usuario selecciona su cuenta
6. La app recibe el token de Google
7. La app envía el token al backend (`/api/mobile/auth`)
8. El backend verifica el token y devuelve un JWT
9. La app guarda el JWT en AsyncStorage
10. Todas las peticiones API incluyen el JWT en el header `Authorization: Bearer <token>`

## 📝 Endpoints de Autenticación

### POST `/api/mobile/auth`
- **Body:** `{ idToken: string }` (token de Google)
- **Response:** 
  ```json
  {
    "success": true,
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "image": "https://...",
      "role": "user"
    }
  }
  ```

## ⚠️ Notas Importantes

1. **Tokens JWT:** Los tokens expiran en 30 días. Si expiran, el usuario necesitará iniciar sesión nuevamente.

2. **Seguridad:** El token se almacena en AsyncStorage. Para mayor seguridad, considera usar Keychain (iOS) o Keystore (Android).

3. **Logout:** El usuario puede cerrar sesión desde cualquier pantalla usando `useAuth().signOut()`

## 🔍 Solución de Problemas

### Error: "DEVELOPER_ERROR" en Google Sign-In
- Verifica que el SHA-1 fingerprint esté correcto en Google Cloud Console
- Asegúrate de usar el mismo proyecto de Google Cloud que tu app web

### Error: "Network request failed" en autenticación
- Verifica que la URL de la API sea correcta
- Verifica tu conexión a internet
- Verifica que el endpoint `/api/mobile/auth` esté desplegado

### Error: "Token inválido"
- Verifica que `GOOGLE_CLIENT_ID` en el backend coincida con el `GOOGLE_WEB_CLIENT_ID` en la app móvil
- Verifica que `AUTH_SECRET` esté configurado en el backend

