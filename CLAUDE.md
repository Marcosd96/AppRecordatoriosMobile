# Gesaccol — instrucciones para agentes

App móvil de recordatorios fiscales para contadores. **React Native 0.82 + TypeScript +
NativeWind** (no Jetpack Compose: solo el widget de Android es Kotlin nativo). Interfaz y
comentarios en español.

## Documentos de referencia

Se cargan automáticamente en cada sesión. Si hay conflicto, mandan sobre este archivo.

| Área | Documento |
|------|-----------|
| Colores, tipografía, espaciado, formas, estados de interacción | DESIGN_SYSTEM.md |
| Qué componente usar, contratos, qué falta unificar | COMPONENT_GUIDELINES.md |
| Pantallas, flujos, navegación, interacción, accesibilidad | MOBILE_UX_RULES.md |
| Archivos, hooks, servicios, consultas, capas | ARCHITECTURE.md |

@DESIGN_SYSTEM.md
@COMPONENT_GUIDELINES.md
@MOBILE_UX_RULES.md
@ARCHITECTURE.md

## Reglas que no se negocian

- **Capas**: `screens/` → `hooks/` (ViewModel) → `services/` → `config/`. Las pantallas y los componentes nunca llaman a `services/` ni a `fetchAPI` directamente.
- **Estado del servidor** solo en TanStack Query, con claves de `queryKeys`. No duplicarlo en `useState`.
- **Estados de pantalla**: carga, vacío, vacío por filtro, error, sin conexión y éxito, siempre resueltos.
- **Colores por rol**, no hex sueltos nuevos. Probar claro y oscuro. Si cambia un rol, actualizar también `android/app/src/main/res/values*/colors.xml` (widget).
- **Accesibilidad**: áreas táctiles ≥ 48 dp, `accessibilityRole`/`accessibilityLabel`, nunca `allowFontScaling={false}`.
- **Prohibido sin excepción** (MOBILE_UX_RULES §7.1): desactivar escalado de fuente, interceptar Atrás, emojis como iconos, herramientas de depuración en producción, acciones que se puedan disparar dos veces.
- **Evitar salvo justificación funcional escrita** (MOBILE_UX_RULES §7.2): gradientes, glassmorphism, sombras, tarjetas para todo, animaciones decorativas, dashboards tipo SaaS, color arbitrario. "Se ve más moderno" no es una justificación.
- Reutiliza los componentes de COMPONENT_GUIDELINES §1 antes de crear uno nuevo.
- **No migrar** a Kotlin, Compose ni otra tecnología. No cambiar contratos de API, rutas ni almacenamiento por motivos visuales. No añadir dependencias sin justificarlo.
- Token de sesión solo en Keychain (`sessionStorage.ts`), nunca en AsyncStorage.

## Forma de trabajar

- Antes de implementar un cambio de UI no trivial, justifica en 2–3 líneas la decisión de UX (qué problema resuelve y por qué ese patrón).
- Para rediseñar una pantalla, sigue MOBILE_UX_RULES §9: diagnóstico primero, cambio mínimo después. No rediseñes pantallas en bloque ni elimines información útil para "limpiar".
- No declares probado nada que no hayas ejecutado.
- Al tocar un archivo con deuda señalada como **Objetivo** en los documentos, migra solo ese archivo; no hagas reescrituras masivas sin pedirlo.
- La lógica pura va en `components/<feature>/*.ts` con su test en `__tests__/`.

## Comandos

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm test            # Jest
npm run android     # ejecutar en emulador/dispositivo
```

Antes de dar un cambio por terminado: `npm run typecheck && npm run lint && npm test`.
