# APK de AppRecordatoriosMobile

## Instalación

1. Transfiere el archivo `AppRecordatoriosMobile-debug.apk` a tu teléfono Android
2. En tu teléfono, habilita la instalación desde fuentes desconocidas:
   - Ve a Configuración > Seguridad > Fuentes desconocidas (o similar según tu dispositivo)
   - Activa la opción para permitir instalaciones desde fuentes desconocidas
3. Abre el archivo APK en tu teléfono y sigue las instrucciones de instalación

## Información del APK

- **Versión**: 1.0 (versionCode: 1)
- **Tipo**: Debug (para pruebas)
- **Tamaño**: ~47 MB
- **Package ID**: com.apprecordatoriosmobile

## Nota

Este es un APK de desarrollo (debug). Para producción, deberás generar un APK firmado con una clave de release.

## Generar nuevo APK

Ejecuta el siguiente comando desde la raíz del proyecto:

```bash
npm run build:apk
```

El APK se generará automáticamente en esta carpeta.

