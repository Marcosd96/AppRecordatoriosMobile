# Solución para Rutas Largas en Windows

## Problema
Windows tiene un límite de 260 caracteres para rutas de archivos, y pnpm crea rutas muy profundas que exceden este límite.

## Soluciones

### Opción 1: Habilitar Rutas Largas en Windows (Recomendado)

1. Abre PowerShell como **Administrador**
2. Ejecuta:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
3. Reinicia tu computadora
4. Verifica que esté habilitado:
   ```powershell
   Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled"
   ```

### Opción 2: Mover el Proyecto a una Ruta Más Corta

Mueve el proyecto a una ruta más corta, por ejemplo:
- De: `C:\Users\marco\AppRecordatoriosMobile`
- A: `C:\Projects\AppRecordatoriosMobile` o `C:\ARMobile`

### Opción 3: Configurar pnpm para Usar Store Más Corto

Ya creé un archivo `.npmrc` con configuración para usar un store más corto.

### Opción 4: Limpiar y Reconstruir

```bash
# Limpiar todo
cd android
./gradlew clean
cd ..
rm -rf node_modules
rm -rf android/.cxx
rm -rf android/app/build
rm -rf android/build

# Reinstalar
pnpm install

# Reconstruir
pnpm exec react-native run-android
```

## Después de Aplicar la Solución

1. Limpia el proyecto:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

2. Reinstala dependencias:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. Reconstruye la app:
   ```bash
   pnpm exec react-native run-android
   ```

## Nota

La **Opción 1** (habilitar rutas largas) es la mejor solución a largo plazo, pero requiere permisos de administrador y reiniciar la computadora.

