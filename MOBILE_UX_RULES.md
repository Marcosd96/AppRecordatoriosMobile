# Reglas de UX móvil — Gesaccol

Cómo se navega, cómo se interactúa y qué está prohibido. Para tokens visuales ver
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); para dónde va el código, [ARCHITECTURE.md](ARCHITECTURE.md).

Principio rector: **optimizar para que la app sea intuitiva y útil en producción, no para que
la captura de pantalla impresione.**

---

## 1. Usuario y tareas principales

Contadores que gestionan vencimientos fiscales de varias empresas. Las tareas, por frecuencia:

1. Ver qué vence pronto o ya venció (Inicio, widget, notificación).
2. Marcar un recordatorio como completado.
3. Crear/editar tareas personales con fecha, hora y recurrencia.
4. Buscar una empresa, recordatorio o tarea concreta.
5. Gestionar empresas y sus calendarios.

Cada decisión de UX se valida contra esta lista: lo frecuente debe estar a ≤ 2 toques.

---

## 2. Navegación

### 2.1 Estructura

```
Stack raíz
├── Splash → Onboarding → Login → WelcomePermissions   (flujo de entrada, sin "atrás")
├── Main (barra de navegación inferior)
│   ├── Inicio          (Dashboard)
│   ├── Tareas          (PersonalTasks)
│   ├── Recordatorios   (Reminders)
│   └── Empresas        (Companies)
├── Search                 (pantalla completa desde Inicio)
├── History                (pantalla completa desde Inicio)
└── NotificationTroubleshooting
```

**Por qué barra inferior**: 4 destinos de primer nivel, de uso equivalente y frecuente. Es el
patrón M3 *navigation bar* para 3–5 destinos en ventana compacta.

### 2.2 Reglas

- Los destinos de primer nivel viven **solo** en la barra inferior. No duplicarlos con botones grandes en Inicio (Inicio usa enlaces "Ver todos").
- Máximo 5 pestañas. Un destino nuevo va al stack o dentro de una pestaña existente.
- El botón Atrás del sistema (y el gesto) siempre funciona: cierra hoja/diálogo → vuelve en el stack → sale de la app desde una pestaña raíz. Nunca interceptarlo para "confirmar salida".
- Tras Login/Onboarding se usa `reset`, no `navigate`: Atrás no debe volver al login.
- Las rutas y parámetros están tipados en `src/navigation/types.ts`. Toda navegación nueva se declara ahí.
- **Enlaces profundos** (`gesaccol://`, notificaciones, widget, búsqueda): llegan a la pestaña con `{ id, highlightAt }`. La pantalla quita filtros, desplaza hasta el elemento y lo resalta 4 s (`useHighlightItem`). Si el elemento ya no existe, se muestra un aviso, no una pantalla vacía.

### 2.3 Barras del sistema e insets

- Contenido dentro de `SafeAreaView` / `useSafeAreaInsets`; nunca alturas fijas para la
  barra de estado o la de navegación.
- La barra de pestañas tiene altura **fija** (`TAB_BAR_HEIGHT` = 60 dp + inset inferior en
  `AppNavigator.tsx`), no escalada con el ancho.
- `StatusBar` con contenido claro/oscuro según el tema (ya en `App.tsx`). Si se activa
  *edge-to-edge* (obligatorio desde Android 15 / targetSdk 35), revisar que listas y hojas
  respeten el inset inferior.
- El teclado no tapa el campo enfocado ni el botón de enviar: `KeyboardAvoidingView` en
  hojas y `keyboardShouldPersistTaps="handled"` en listas con buscador.

### 2.4 Ventanas grandes (tablet, plegables, horizontal)

Clases de tamaño de ventana M3 sobre el ancho en dp:

| Clase      | Ancho        | Navegación             | Contenido |
|------------|--------------|------------------------|-----------|
| Compacta   | < 600        | Barra inferior         | Una columna |
| Mediana    | 600–839      | Barra inferior o *rail* | Una columna con ancho máx. ~640 dp, o 2 columnas en Inicio |
| Expandida  | ≥ 840        | *Navigation rail* lateral | Lista + detalle (p. ej. Empresas → recordatorios de la empresa) |

- `useResponsive()` expone `windowClass` (`'compact' | 'medium' | 'expanded'`, cortes 600/840) e `isTablet` (= no compacta). El layout se decide con ellos; los tamaños de texto y espaciado no cambian con la ventana.
- `FormSheet` ya se presenta centrado en tablet: mantenerlo.
- Plegables: la UI debe sobrevivir a cambios de tamaño en caliente sin perder el formulario abierto ni la posición de la lista (el estado vive en hooks, no en la medición).
- No bloquear la orientación salvo en Onboarding.

---

## 3. Interacciones

| Necesidad                         | Patrón | No usar |
|-----------------------------------|--------|---------|
| Crear un elemento en una lista    | FAB o botón en `ScreenHeader` → `FormSheet` | Pantalla nueva para un formulario corto |
| Filtrar una lista                 | `FilterChips` con recuento | Menú desplegable oculto |
| Elegir entre 2–4 opciones         | `SegmentedControl` | Radio buttons verticales |
| Fecha/hora                        | Selector nativo (`@react-native-community/datetimepicker`) | Campos de texto para fecha |
| Acción destructiva                | `StyledModal` de confirmación con botón destructivo | Borrar sin confirmar |
| Resultado de una acción reversible| Mensaje breve (snackbar) con "Deshacer" | Diálogo modal "¡Éxito!" |
| Error que bloquea                 | `StyledModal` con mensaje y acción | `console.error` silencioso |
| Recargar                          | Arrastrar para actualizar (`RefreshControl`) en toda lista | Botón "Recargar" permanente |

- Una sola acción *filled* por pantalla u hoja. En listas, la acción de cada fila no es
  *filled*: con 20 filas habría 20 botones principales compitiendo.
- Mientras una acción está en curso, su control queda deshabilitado y en estado *busy*.
  Las acciones reversibles frecuentes (completar un recordatorio) se aplican de forma
  optimista y ofrecen "Deshacer" en un snackbar.
- Cada control táctil muestra los estados de DESIGN_SYSTEM §2.4. En Android, preferir el
  *ripple* nativo (`Pressable` + `android_ripple`) a la escala de `AnimatedButton` en filas.
- Los botones dicen el verbo concreto: "Guardar tarea", "Marcar como completado". Nunca "OK" o "Aceptar" si se puede ser específico.
- Al guardar: deshabilitar el botón y mostrar progreso en él; no cerrar la hoja hasta tener la respuesta. Si falla, la hoja sigue abierta con los datos introducidos.
- Validar en el cliente antes de enviar (`validateTaskForm`) y mostrar el error junto al campo, no en un diálogo.
- Fechas en formato local `es-CO` y relativas cuando ayudan ("en 3 días", "hace 2 días").

---

## 4. Estados de pantalla (obligatorios)

Toda pantalla que muestre datos remotos resuelve explícitamente los cinco estados:

| Estado | Cuándo | Qué se muestra |
|--------|--------|----------------|
| **Carga inicial** | Sin caché y pidiendo | `LoadingScreen` o esqueleto de lista |
| **Datos** | Hay datos (aunque sean de caché) | La lista; si se está refrescando, solo el indicador de `RefreshControl` |
| **Vacío** | Respuesta correcta sin elementos | `EmptyState` con explicación y la acción que lo resuelve ("Crear tarea") |
| **Vacío por filtro** | Hay datos pero el filtro/búsqueda no coincide | `EmptyState` distinto: "Ningún resultado para…" + "Quitar filtros" |
| **Error** | Falló y **no hay** caché | Mensaje comprensible + "Reintentar". Con caché, se siguen mostrando los datos y basta el aviso |
| **Sin conexión** | `onlineManager` offline | `OfflineBanner` global; las acciones que requieren red se deshabilitan o se avisa al intentarlas |
| **Éxito** | Acción completada | El cambio visible en la lista + snackbar breve si no es obvio |

Nunca se muestra una pantalla en blanco ni un spinner indefinido. Los mensajes de error no exponen
textos técnicos (`Network request failed`, códigos HTTP): se traducen en `api.ts`.

---

## 5. Accesibilidad

Objetivo: WCAG 2.2 AA y las guías de accesibilidad de Android.

### Áreas táctiles
- Mínimo **48 × 48 dp** en Android (44 pt iOS). Si el elemento visual es menor, usar `hitSlop` hasta alcanzarlo.
- Separación mínima de 8 dp entre objetivos táctiles adyacentes.

### Lectores de pantalla (TalkBack / VoiceOver)
- Todo control con `accessibilityRole` (`button`, `header`, `switch`, `tab`…).
- Estado con `accessibilityState` (`selected`, `checked`, `disabled`, `busy`).
- Icono sin texto ⇒ `accessibilityLabel` en español y con el verbo ("Eliminar tarea").
- Filas con varias piezas de texto: agrupar con `accessible` y una etiqueta resumen ("IVA, Empresa X, vence en 3 días, pendiente"); las acciones secundarias se exponen con `accessibilityActions`.
- Cambios dinámicos (offline, resultados de búsqueda, errores) con `accessibilityLiveRegion="polite"` o `AccessibilityInfo.announceForAccessibility`.
- Al abrir una hoja/diálogo, el foco pasa a su título; al cerrarlo, vuelve al control que lo abrió.

### Tamaño de fuente
- La app debe ser utilizable con la fuente del sistema al **200 %**: el texto se ajusta en varias líneas, los contenedores crecen; nada se recorta.
- Prohibido `allowFontScaling={false}` en contenido.

### Teclado, D-pad y Chromebook
- Orden de foco = orden visual. Todos los elementos interactivos son alcanzables con Tab/flechas.
- Indicador de foco visible (no eliminar el resaltado nativo).
- En formularios, "Siguiente" del teclado salta al siguiente campo (`returnKeyType`, `onSubmitEditing`); el último campo envía.
- Enter activa el botón enfocado; Escape/Atrás cierra la hoja.

### Color y movimiento
- El color nunca es la única señal (ver DESIGN_SYSTEM §2.2).
- Respetar "Reducir movimiento".

---

## 6. Notificaciones y widget

- La notificación lleva a la pantalla exacta y resalta el elemento (ver §2.2).
- Las acciones rápidas de la notificación (completar, posponer) actualizan la caché y el widget sin abrir la app.
- Los permisos se piden **en contexto** (`WelcomePermissions` explica para qué) y, si se niegan, la app sigue funcionando y ofrece cómo activarlos en `NotificationTroubleshooting`.
- El widget muestra la misma información y estados de vencimiento que la app.

---

## 7. Patrones prohibidos y patrones a evitar

### 7.1 Prohibidos (sin excepción)

Rompen accesibilidad o convenciones de la plataforma; no hay justificación que los compense.

| Prohibido | Motivo |
|-----------|--------|
| `allowFontScaling={false}` en contenido, texto dentro de imágenes | Inaccesible |
| Interceptar Atrás para "¿Seguro que quieres salir?" | Rompe la navegación esperada en Android |
| Hamburguesa/drawer para los destinos principales | Oculta navegación frecuente |
| Emojis como iconos o en títulos de botones, diálogos y notificaciones | Se ven distinto en cada fabricante y TalkBack los lee en voz alta ("cara de alerta…") |
| Herramientas de depuración o prueba **a la vista** en listas, tarjetas o pantallas principales | Ruido para el usuario y acciones que no entiende. Se permiten en la pantalla de Diagnóstico o al final de un menú secundario (⋮), en un grupo titulado "Diagnóstico…" |
| Spinners sin límite ni mensaje; pantallas en blanco | El usuario no sabe si esperar |
| Acción que se pueda disparar dos veces mientras está en curso | Duplica o revierte el cambio (p. ej. *toggle*) |

### 7.2 Evitar salvo justificación funcional ("AI slop")

No son prohibiciones absolutas: se permiten si se puede explicar en una frase **qué tarea
del usuario facilitan**. "Se ve más moderno" no es una justificación.

| Patrón | Por qué se evita | Cuándo sí |
|--------|------------------|-----------|
| Gradientes, *glassmorphism*, desenfoques | Decoran y reducen contraste | Casi nunca en esta app |
| Sombras marcadas | La elevación indica superposición, no importancia | Hojas, diálogos, FAB, menús |
| Tarjetas para todo / anidadas | Rompen la lectura en lista | Elementos con varios datos y acciones propias (COMPONENT_GUIDELINES §4) |
| Radios grandes en todo | Restan densidad y precisión | Hojas (`rounded-t-3xl`), chips |
| Iconos decorativos sin significado | Ruido; compiten con los iconos que sí informan | — |
| Animaciones decorativas (logo que gira, rebotes, círculos de fondo) | Retrasan y distraen | Transiciones que explican de dónde viene algo |
| Encabezados gigantes, saludos | Desperdician el primer pliegue | Pantallas de marca (Login, Onboarding) |
| Color arbitrario por botón | El color deja de significar estado | — (usar roles) |
| Dashboard SaaS: rejilla de KPIs, gráficos, "tarjetas resumen" apiladas | Inicio debe responder "¿qué tengo que hacer hoy?" | Historial, donde la métrica es el contenido |
| Muchas acciones visibles por elemento | Ninguna destaca; aumenta errores | Una acción principal visible + el resto en menú o en la edición |
| Componentes distintos para la misma acción | El usuario reaprende en cada pantalla | — (unificar, ver COMPONENT_GUIDELINES) |
| Menús flotantes / *speed dial* | Ocultan acciones y tapan contenido | — |
| Diálogo modal para confirmar un éxito ("Éxito") | Interrumpe | — (snackbar o el cambio visible en la lista) |
| Carruseles automáticos | No se leen al propio ritmo | — |
| `Alert.alert` en flujos nuevos | Rompe el tema | — (usar `StyledModal`) |

Las justificaciones se escriben en la descripción del PR.

---

## 8. Checklist de PR (UX)

- [ ] Estados carga / vacío / vacío por filtro / error / offline resueltos.
- [ ] Áreas táctiles ≥ 48 dp; roles, estados y etiquetas de accesibilidad.
- [ ] Probado con TalkBack y con fuente al 200 %.
- [ ] Probado en horizontal y en ancho ≥ 600 dp (emulador de tablet o plegable).
- [ ] Atrás del sistema se comporta como se espera.
- [ ] Ningún patrón de §7.1; los de §7.2, justificados.
- [ ] Ninguna acción se puede disparar dos veces mientras está en curso.
- [ ] Si la decisión de UX no es obvia, justificada en la descripción del PR (2–3 líneas: qué problema resuelve y por qué este patrón).

---

## 9. Rediseñar con criterio

No se rediseñan pantallas en bloque. Antes de cambiar una pantalla se responde, por escrito:

1. **Propósito**: qué tarea de §1 resuelve.
2. **Acción principal**: cuál es y si es la más visible.
3. **Jerarquía**: qué ve el usuario primero y si es lo más importante.
4. **Componentes**: cuáles usa y si existen equivalentes compartidos.
5. **Problemas**: visuales y funcionales, clasificados por impacto (crítico, alto, medio, bajo).
6. **Cambio mínimo**: solo lo necesario para resolverlos; se conservan funciones e información útil.
7. **Coherencia**: que el resultado se parezca a las pantallas hermanas.

Restricciones:
- No cambiar contratos de API, rutas de navegación ni almacenamiento por motivos visuales.
- No añadir dependencias sin justificación técnica escrita.
- No tocar el widget Kotlin salvo necesidad explícita.
- No declarar probado lo que no se ha ejecutado.
