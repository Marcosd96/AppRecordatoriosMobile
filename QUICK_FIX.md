# Solución Rápida para Rutas Largas

## ⚠️ Problema Actual
Windows tiene un límite de 260 caracteres y pnpm crea rutas muy profundas que exceden este límite.

## ✅ Solución Inmediata (Sin Reiniciar)

### Opción A: Compilar solo para tu arquitectura

Si tu dispositivo es ARM64 (la mayoría de dispositivos modernos):

```bash
cd android
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
cd ..
pnpm exec react-native run-android --variant=debug
```

Si tu dispositivo es x86_64 (emulador):

```bash
cd android
./gradlew assembleDebug -PreactNativeArchitectures=x86_64
cd ..
pnpm exec react-native run-android --variant=debug
```

### Opción B: Habilitar Rutas Largas (Requiere Reinicio)

**Esta es la mejor solución a largo plazo:**

1. Abre PowerShell como **Administrador** (Win+X > Windows PowerShell (Administrador))
2. Ejecuta:
   ```powershell
   cd C:\Users\marco\AppRecordatoriosMobile
   .\enable-long-paths.ps1
   ```
3. **Reinicia tu computadora**
4. Después del reinicio, compila normalmente:
   ```bash
   pnpm exec react-native run-android
   ```

### Opción C: Mover el Proyecto a Ruta Más Corta

```bash
# Mueve el proyecto de:
C:\Users\marco\AppRecordatoriosMobile

# A algo más corto como:
C:\Projects\ARMobile
# o
C:\ARMobile
```

Luego reinstala dependencias:
```bash
rm -rf node_modules
pnpm install
pnpm exec react-native run-android
```

## 🎯 Recomendación

**Usa la Opción A ahora** para poder compilar inmediatamente, y luego aplica la **Opción B** cuando puedas reiniciar tu computadora para una solución permanente.

