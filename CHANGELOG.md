# Changelog

Todas las actualizaciones relevantes de Gesaccol se documentan aquí siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

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

[1.0.0]: https://github.com/USER/REPO/releases/tag/v1.0.0

