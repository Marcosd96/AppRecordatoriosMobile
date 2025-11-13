# Configuración de API para AppRecordatorios Mobile

## 📋 Requisitos Previos

1. El servidor Next.js de AppRecordatorios debe estar ejecutándose
2. Debes tener una sesión activa en Next.js (autenticado)

## 🔧 Configuración de la URL de la API

### Para Desarrollo Local

1. **En Emulador Android/iOS:**
   - Usa `http://10.0.2.2:3000` para Android Emulator
   - Usa `http://localhost:3000` para iOS Simulator

2. **En Dispositivo Físico:**
   - Necesitas usar la IP local de tu computadora
   - Ejemplo: `http://192.168.1.100:3000` (reemplaza con tu IP)
   - Para encontrar tu IP:
     - Windows: `ipconfig` en CMD
     - Mac/Linux: `ifconfig` o `ip addr`

3. **Edita el archivo:** `src/config/api.ts`
   ```typescript
   export const API_BASE_URL = __DEV__
     ? 'http://TU_IP_LOCAL:3000' // Cambia esto a tu IP local
     : 'https://app-recordatorios.vercel.app'; // URL de producción
   ```

## 🔐 Autenticación

**Nota:** Las APIs requieren autenticación con NextAuth. Actualmente las APIs están protegidas y requieren una sesión activa.

### Opciones para Autenticación Móvil:

1. **Usar cookies de sesión** (si Next.js y la app están en el mismo dominio)
2. **Crear un endpoint de autenticación móvil** que devuelva un token JWT
3. **Deshabilitar temporalmente la autenticación** para desarrollo (NO recomendado para producción)

## 📡 Endpoints Disponibles

### Recordatorios
- `GET /api/mobile/reminders` - Obtener todos los recordatorios
- `POST /api/mobile/reminders/:id/toggle` - Cambiar estado de recordatorio

### Empresas
- `GET /api/mobile/companies` - Obtener todas las empresas
- `POST /api/mobile/companies` - Crear nueva empresa
- `DELETE /api/mobile/companies/:id` - Eliminar empresa

### Dashboard
- `GET /api/mobile/dashboard` - Obtener datos del dashboard

## 🚀 Pruebas Rápidas

1. Asegúrate de que Next.js esté corriendo:
   ```bash
   cd AppRecordatorios
   npm run dev
   ```

2. Verifica que puedas acceder a las APIs desde tu navegador:
   - `http://localhost:3000/api/mobile/dashboard`
   - Debe requerir autenticación

3. Actualiza la URL en `src/config/api.ts`

4. Ejecuta la app móvil:
   ```bash
   cd AppRecordatoriosMobile
   npm run android
   # o
   npm run ios
   ```

## ⚠️ Solución de Problemas

### Error: "Network request failed"
- Verifica que Next.js esté corriendo
- Verifica que la IP/URL sea correcta
- En Android, asegúrate de tener permisos de internet en `AndroidManifest.xml`

### Error: "No autorizado" (401)
- Necesitas estar autenticado en Next.js
- Considera implementar autenticación móvil (JWT tokens)

### Error: "Connection refused"
- Verifica el firewall
- Asegúrate de que Next.js esté escuchando en todas las interfaces (0.0.0.0)

## 📝 Próximos Pasos

1. Implementar autenticación móvil con JWT
2. Agregar manejo de tokens de refresco
3. Implementar caché local con AsyncStorage
4. Agregar sincronización offline

