# Arquitectura — Gesaccol

Estructura del código, gestión del estado y reparto de responsabilidades. Ver también
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) y [MOBILE_UX_RULES.md](MOBILE_UX_RULES.md).

## 1. Stack

| Capa | Tecnología |
|------|-----------|
| UI | React Native 0.82, React 19, NativeWind 4 (Tailwind 3), `react-native-svg` |
| Navegación | React Navigation 7 (stack + bottom tabs), rutas tipadas |
| Estado del servidor | TanStack Query 5, persistido en AsyncStorage (offline-first, 7 días) |
| Sesión | `react-native-keychain` (token), Google Sign-In |
| Notificaciones | Notifee (alarmas exactas, acciones rápidas) |
| Nativo Android | Widget en Kotlin (`android/.../widget`) vía `WidgetModule` |
| Calidad | TypeScript estricto, ESLint, Jest |

> **Equivalencias con Android nativo** (para quien venga de Kotlin/Compose):
> *Composable* → componente de `screens/` o `components/`; *ViewModel* → hook de pantalla
> en `hooks/`; *Repository* → `services/` + consultas de `hooks/queries.ts`;
> *UiState* → objeto devuelto por el hook de pantalla; *StateFlow* → estado de TanStack
> Query / `useState` que provoca un nuevo render; *Room/DataStore* → caché persistida de
> TanStack Query y AsyncStorage.
>
> Son **analogías conceptuales**, no equivalencias de comportamiento: un hook vive y muere con
> el componente (no sobrevive a la rotación por sí mismo como un ViewModel; aquí lo que
> sobrevive es la caché), y no hay corrutinas ni *scopes*. **No se migra a Kotlin, Compose
> ni otra tecnología.**

---

## 2. Capas y dependencias

```
screens/        UI de pantalla: compone componentes, lee el hook, sin lógica de negocio
   │
   ▼
hooks/          "ViewModels": estado de UI + acciones (useHome, useReminders, usePersonalTasks, useCompanies)
   │               también hooks compartidos: useNotificationStatus, useCompleteReminder
   │               └── queries.ts: consultas compartidas y claves de caché
   ▼
services/       Acceso a datos y efectos: API, notificaciones, sesión, widget
   │
   ▼
config/         Cliente HTTP (api.ts), QueryClient, entorno
types/          Modelos de dominio compartidos

components/<feature>/*.ts   Lógica pura de la feature (formularios, formatos, estadísticas)
```

**Regla de dependencia**: cada capa solo importa de las de abajo.
- `services/` nunca importa de `screens/`, `components/` ni React.
- `components/` no llama a `services/` ni a `fetchAPI`; recibe datos y callbacks por props.
- `screens/` no llama a `services/` directamente: pasa por un hook.

---

## 3. Estructura de paquetes

```
src/
├── components/
│   ├── *.tsx                     Componentes genéricos del sistema de diseño
│   ├── icons/                    SVG
│   └── <feature>/                companies, dashboard, history, personalTasks, reminders, search
│       ├── *Card.tsx, *Modal.tsx Componentes de presentación de la feature
│       └── *.ts                  Lógica pura testeable (taskForm.ts, companyStats.ts…)
├── config/                       api.ts, queryClient.ts, env.ts, calendarTypes.ts
├── context/                      AuthContext, ThemeContext, SnackbarContext (estado global de UI, no de datos)
├── hooks/                        Hooks de pantalla y utilidades de UI
├── navigation/                   AppNavigator, types.ts, notificationNavigation.ts
├── screens/                      Una por destino
├── services/                     <recurso>Service.ts, notifications/, sessionStorage, widget
├── theme/                        colors.ts: roles de color para props que no aceptan clases
└── types/                        Modelos de dominio
```

Convenciones:
- Feature nueva ⇒ `components/<feature>/`, `hooks/use<Feature>.ts`, `services/<feature>Service.ts`, `screens/<Feature>Screen.tsx`, tests en `__tests__/<modulo>.test.ts`.
- Archivos `.ts` (sin JSX) dentro de `components/<feature>/` son **lógica pura**: sin React, sin red, sin AsyncStorage. Se testean con Jest sin mocks.
- Nombres de archivo: componentes en `PascalCase.tsx`, el resto en `camelCase.ts`.

---

## 4. Estado

### 4.1 Tipos de estado y dónde vive cada uno

| Tipo | Ejemplo | Dónde |
|------|---------|-------|
| Datos del servidor | recordatorios, tareas, empresas | TanStack Query (`hooks/queries.ts`) |
| Estado de UI de pantalla | filtro activo, búsqueda, hoja abierta, formulario | Hook de pantalla o `useState` en la pantalla si es puramente visual |
| Estado global de app | sesión, tema | `context/` |
| Preferencias locales | onboarding visto, tema elegido | AsyncStorage (leído desde un context o hook) |
| Secretos | token de sesión | Keychain (`sessionStorage.ts`) — nunca AsyncStorage |
| Navegación | pantalla y parámetros | React Navigation (`navigation/types.ts`) |

No se duplica estado del servidor en `useState`: se deriva con `useMemo` de los datos de la caché.

### 4.2 Hooks de pantalla (ViewModel)

Un hook por pantalla con datos. Patrón de referencia: `hooks/useReminders.ts` (incluye actualización optimista con vuelta atrás) y `hooks/usePersonalTasks.ts`.

Responsabilidades:
- Leer las consultas necesarias y refrescarlas al recuperar el foco (`useRefetchOnFocus`).
- Exponer el **estado de UI** ya derivado (`tasks`, `stats`, `loading`, `refreshing`).
- Exponer **acciones** con nombre de intención (`saveTask`, `updateTaskStatus`, `deleteTask`), que llaman al servicio, invalidan la caché y devuelven el resultado.
- Exponer el error de carga sin caché como `loadError` + `retry`/`retrying`; la pantalla lo pinta con `ErrorState`.
- Las acciones devuelven un `ActionResult` (`hooks/actionResult.ts`): la pantalla confirma los éxitos con snackbar y muestra los errores en un diálogo. (`useCompanies` aún usa su propio tipo `{ ok, message }`; se unifica al tocarlo.)
- Una acción no se puede lanzar dos veces sobre el mismo elemento mientras está en curso: el hook lleva el registro (`togglingIds`, `busyTaskIds`).

No hace: JSX, estilos, navegación, `Alert`.

### 4.3 Estado de UI explícito

**Actual**: los hooks devuelven banderas sueltas (`loading`, `refreshing`, `tasks`).
**Objetivo** para hooks nuevos o al refactorizar: un tipo discriminado que haga imposible
combinar estados contradictorios y obligue a la pantalla a tratarlos todos:

```ts
export type ListState<T> =
  | { kind: 'loading' }                                   // sin caché, pidiendo
  | { kind: 'error'; message: string; retry: () => void } // sin caché, falló
  | { kind: 'empty' }                                     // respuesta vacía
  | { kind: 'content'; items: T[]; refreshing: boolean; stale: boolean };

// En la pantalla:
switch (state.kind) {
  case 'loading': return <LoadingScreen />;
  case 'error':   return <ErrorState message={state.message} onRetry={state.retry} />;
  case 'empty':   return <EmptyState … />;
  case 'content': return <FlatList data={state.items} … />;
}
```

El "vacío por filtro" se resuelve en la pantalla: `content` con `items` filtrados a cero.

### 4.4 Caché y modo sin conexión

- Claves centralizadas en `queryKeys` (`config/queryClient.ts`). Nunca escribir claves literales.
- `networkMode: 'offlineFirst'`: con caché se muestra siempre; sin conexión las consultas se pausan y se reanudan solas.
- Reintentos solo para red/5xx (`shouldRetry`); los 4xx se muestran al usuario.
- Tras una mutación: `invalidateQueries` de las claves afectadas. `NotificationSync` y `WidgetSync` reaccionan a la caché para reprogramar notificaciones y refrescar el widget; las pantallas no los llaman.
- Cerrar sesión ⇒ `clearQueryCache()` + borrar token.

---

## 5. Servicios

- Un archivo por recurso; funciones que devuelven modelos de `types/`, ya deserializados (fechas como `Date` o ISO consistente).
- Todo HTTP pasa por `fetchAPI` (`config/api.ts`): añade token, traduce errores a `ApiError` con `status` (0 = sin red) y mensaje legible.
- Sin estado propio en memoria salvo cachés técnicas documentadas.
- Efectos del sistema (notificaciones, widget, keychain) aislados en su servicio y mockeados en `__mocks__/`.

---

## 6. Componentes de UI

- **Presentacionales**: reciben datos y callbacks por props; no conocen la API ni la caché.
- Catálogo y contratos de componentes en [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md).
- Un componente de más de ~250 líneas o con más de una responsabilidad (p. ej. tarjeta +
  herramientas de diagnóstico) se divide.
- Tema: hoy se pasa `isDark` por props. **Objetivo**: clases `dark:` y tokens semánticos (DESIGN_SYSTEM §2.3) para que los componentes dejen de recibir `isDark`.
- Listas con `FlatList` (virtualizadas), `keyExtractor` por `id`, nunca `ScrollView` + `map` para colecciones de longitud variable.
- Callbacks de filas memorizados (`useCallback`) y filas con `React.memo` cuando la lista supera ~50 elementos.
- `ErrorBoundary` en la raíz: un fallo de render muestra una pantalla de recuperación, no cierra la app.

---

## 7. Navegación

- Rutas y parámetros en `navigation/types.ts`; pantallas tipadas con `RootStackScreenProps<'X'>` / `MainTabScreenProps<'X'>`.
- Navegación desde fuera de React (notificaciones, widget) mediante `navigationRef` y `flushPendingNavigation` (`notificationNavigation.ts`), que espera a que el navegador esté listo.
- Parámetros mínimos y serializables (ids, no objetos completos): la pantalla obtiene los datos de la caché.

---

## 8. Código nativo

- Kotlin solo donde RN no llega (widget). El puente es `WidgetModule`; los datos se envían desde `widgetService.ts` como JSON.
- Los colores y textos del widget se mantienen alineados con DESIGN_SYSTEM.
- Ningún cambio en `android/` o `ios/` sin probar el build de release (`npm run build:apk:release`, que funciona en Windows, Linux y macOS: `scripts/build-apk.js`).

---

## 9. Pruebas

| Qué | Cómo |
|-----|------|
| Lógica pura (`components/<feature>/*.ts`, `services/notifications/recurrence.ts`…) | Jest, sin mocks, casos límite (fechas, zonas horarias, recurrencias) |
| Servicios | Jest con `fetch` y módulos nativos mockeados |
| Hooks de pantalla | `renderHook` con `QueryClientProvider` de prueba |
| Navegación por notificación | `notificationNavigation.test.ts` |

Antes de un PR: `npm run typecheck && npm run lint && npm test`.

---

## 10. Cómo añadir una feature (receta)

1. Modelo en `types/index.ts`.
2. Endpoint en `API_ENDPOINTS` y servicio en `services/<feature>Service.ts`.
3. Clave en `queryKeys` y consulta en `hooks/queries.ts`.
4. Lógica pura (validación, formato, estadísticas) en `components/<feature>/<feature>.ts` + test.
5. Hook de pantalla `hooks/use<Feature>.ts` con estado de UI y acciones.
6. Componentes de presentación en `components/<feature>/`.
7. Pantalla en `screens/` y ruta en `navigation/types.ts` + `AppNavigator.tsx`.
8. Revisar los checklists de DESIGN_SYSTEM §10, COMPONENT_GUIDELINES §7 y MOBILE_UX_RULES §8.
