# Guía de componentes — Gesaccol

Qué componente usar, cómo y qué falta por unificar. Los tokens que consumen están en
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); el comportamiento, en [MOBILE_UX_RULES.md](MOBILE_UX_RULES.md);
dónde vive el código, en [ARCHITECTURE.md](ARCHITECTURE.md).

Regla general: **si un patrón aparece en dos o más pantallas, es un componente compartido**
en `src/components/`. Antes de crear uno, busca aquí.

Cada entrada indica su estado:
- **Existe**: usarlo tal cual.
- **Objetivo**: no existe aún; crearlo la primera vez que se necesite y migrar los usos al
  tocar cada archivo (sin reescrituras masivas).

---

## 1. Catálogo

| Componente | Estado | Archivo | Cuándo usarlo |
|------------|--------|---------|---------------|
| `ScreenHeader` | Existe | `components/ScreenHeader.tsx` | Cabecera de las 4 pestañas: título, subtítulo, una acción a la derecha |
| `StackHeader` | Existe | `components/StackHeader.tsx` | Cabecera de pantallas del stack: botón Atrás + título (o un campo, como en Búsqueda) + acción opcional |
| `Button` | Existe | `components/Button.tsx` | Todo botón con texto. Única excepción: "Continuar con Google" en Login, que sigue las normas de marca de Google |
| `IconButton` | Existe | `components/IconButton.tsx` | Botón solo icono, 48 dp, `accessibilityLabel` obligatorio |
| `SearchField` | Existe | `components/SearchField.tsx` | Campo de búsqueda con icono y botón de borrar |
| `FilterChips` | Existe | `components/FilterChips.tsx` | Filtrar una lista por una dimensión, con recuento |
| `SegmentedControl` | Existe | `components/SegmentedControl.tsx` | 2–4 opciones excluyentes dentro de un formulario o ajuste |
| `StatusBadge` | Existe | `components/StatusBadge.tsx` | Insignia de estado o categoría, con tonos por rol |
| `FormSheet` + `FormField` | Existe | `components/FormSheet.tsx` | Crear/editar. Hoja inferior en móvil, diálogo centrado en tablet, acciones fijas al pie |
| `inputClassName` / `placeholderColor` | Existe | `components/FormSheet.tsx` | Estilo de `TextInput` en formularios |
| `StyledModal` | Existe | `components/StyledModal.tsx` | Diálogo M3: confirmaciones destructivas y errores que bloquean |
| `ActionSheet` | Existe | `components/ActionSheet.tsx` | Acciones secundarias de un elemento (⋮): hoja inferior con filas de 56 dp, agrupables con título. La acción se ejecuta al terminar de cerrarse |
| `Snackbar` | Existe | `context/SnackbarContext.tsx` | Confirmar un éxito y ofrecer "Deshacer": `useSnackbar().showSnackbar({ message, actionLabel?, onAction? })`. Disponible en las pestañas (`SnackbarProvider` en `MainTabs`) |
| `EmptyState` | Existe | `components/EmptyState.tsx` | Lista sin elementos o sin resultados por filtro |
| `ErrorState` | Existe | `components/ErrorState.tsx` | Error de carga sin caché: mensaje + "Reintentar", en el lugar de la lista |
| `LoadingScreen` | Existe | `components/LoadingScreen.tsx` | Carga inicial sin caché |
| `OfflineBanner` | Existe | `components/OfflineBanner.tsx` | Modo sin conexión (montado en `MainTabs`) |
| `ListRow` | Existe | `components/ListRow.tsx` | Fila de lista (56 dp): título, subtítulo, chevron o contenido a la derecha; `destructive` y `divider`. Ajustes, enlaces de Inicio |
| `ListGroup` | Existe | `components/ListGroup.tsx` | Contenedor con borde para un grupo de `ListRow` con divisores, con título de sección opcional. Inicio, Búsqueda, Historial |
| `ReminderCard` | Existe | `components/reminders/ReminderCard.tsx` | Elemento de lista de recordatorios |
| `TaskCard` | Existe | `components/personalTasks/TaskCard.tsx` | Elemento de lista de tareas: una acción visible + ⋮; tocarla edita |
| `CompanyCard` | Existe | `components/companies/CompanyCard.tsx` | Elemento de lista de empresas: tocarla abre sus recordatorios; resto en ⋮ |
| `FocusRing` + `useFocusRing` | Existe | `components/FocusRing.tsx`, `hooks/useFocusRing.ts` | Anillo de foco de teclado/D-pad (DESIGN_SYSTEM §2.4) en todo control táctil propio |
| `HighlightRing` | Existe | `components/HighlightRing.tsx` | Resaltado que se funde en una tarjeta al llegar desde una notificación o la búsqueda (`useHighlightItem`) |
| `ErrorBoundary` | Existe | `components/ErrorBoundary.tsx` | Raíz de la app |
| Iconos | Existe | `components/icons/` | Todo icono. Nunca emojis ni caracteres (`✕`, `✓`, `▲`) como icono |

---

## 2. Botones

Un único componente `Button` con variantes.

| Variante | Clases | Uso | Límite |
|----------|--------|-----|--------|
| `filled` | `bg-blue-600` · texto `white` `text-sm font-semibold` · `rounded-xl` · `min-h-12 px-4` | Acción principal | **Una** por pantalla u hoja |
| `tonal` | `primaryContainer` · texto `onPrimaryContainer` | Acción secundaria importante ("Editar") | — |
| `secondary` | `secondaryContainer` · texto `secondary` | Acción neutra ("Calendarios", "Cancelar") | — |
| `text` | Sin fondo · texto `primary` | Enlaces de sección ("Ver todos", "Limpiar filtros") | — |
| `destructive` | `bg-red-600` · texto `white` | Confirmar eliminación | Solo dentro de un diálogo |

Contrato de `Button`:

```ts
interface ButtonProps {
  label: string;               // verbo concreto: "Guardar tarea", no "OK"
  onPress: () => void;
  variant?: 'filled' | 'tonal' | 'secondary' | 'text' | 'destructive';
  renderIcon?: (color: string) => React.ReactNode;
  busy?: boolean;              // muestra indicador, bloquea pulsaciones, accessibilityState.busy
  disabled?: boolean;          // 38 % de opacidad, accessibilityState.disabled
  fullWidth?: boolean;
}
```

Reglas:
- Altura mínima 48 dp. El texto no se recorta: crece en alto con la fuente al 200 %.
- `busy` impide una segunda pulsación; es la protección contra acciones duplicadas.
- Sin `+` ni símbolos en el texto ("+ Nueva" ⇒ icono + "Nueva tarea").
- El color de la variante no se cambia por pantalla: si hace falta otro color, es otra variante.

---

## 3. Cabeceras

| Tipo | Componente | Contenido |
|------|-----------|-----------|
| Pestaña | `ScreenHeader` | Título (`headlineSmall`), subtítulo de estado útil ("2 vencidos · 5 pendientes"), **una** acción |
| Stack | `StackHeader` | Atrás (48 dp) + título (`titleMedium`) + acción opcional |

- El subtítulo informa del estado; no repite el título ("Gestiona tus clientes" no aporta).
- Inicio no saluda: el título es "Inicio" y el subtítulo, el resumen del día
  ("2 vencidos · 3 esta semana" o "Todo al día").
- "Cerrar sesión", "Apariencia" y el estado de las notificaciones están en **Ajustes**
  (`SettingsScreen`), a la que se llega con el icono de ajustes de la cabecera de Inicio.

---

## 4. Elementos de lista

### Fila vs. tarjeta

| Usar | Cuándo |
|------|--------|
| **Fila** (fondo `surface`, divisor `outline`, sin borde redondeado propio) | Elemento con título + 1–2 líneas + como mucho una acción. Resultados de búsqueda, historial, ajustes |
| **Tarjeta con borde** (`rounded-2xl`, `outline`) | Elemento con varios datos, estado y acciones propias: recordatorio, tarea, empresa |

Nunca tarjeta dentro de tarjeta. Los bloques internos se separan con espacio o un divisor,
no con otra caja con fondo y borde.

### Anatomía de una tarjeta de elemento

```
┌─┬───────────────────────────────────────┐
│▌│ [Estado] [Categoría]                   │  insignias (StatusBadge)
│▌│ Título del elemento                    │  titleSmall
│▌│ Contexto (empresa, recurrencia)        │  bodyMedium, onSurfaceVariant
│▌│ Vence 15 nov · en 3 días   [Acción ▸]  │  fecha + UNA acción visible
└─┴───────────────────────────────────────┘
 └ franja de urgencia (solo recordatorios y tareas con fecha)
```

- **Una acción visible** por elemento; el resto (editar, pausar, cancelar, eliminar) en un
  menú de desbordamiento (⋮) o al tocar el elemento.
- Tocar el elemento abre su detalle/edición; la acción visible es la más frecuente
  ("Completar").
- La acción de fila no es *filled*: `tonal` o `secondary` (MOBILE_UX_RULES §3).
- `accessible` con etiqueta resumen y `accessibilityActions` para las acciones del menú.

### Problemas actuales a corregir al tocar cada archivo

`ReminderCard`, `TaskCard` y `CompanyCard` siguen esta anatomía. En `CompanyCard`, tocar abre
los recordatorios de la empresa y ⋮ ofrece Calendarios, Ciudad y Eliminar; la única acción a la
vista es "Elegir calendarios" cuando la empresa aún no tiene recordatorios.

---

## 5. Diálogos, hojas y mensajes

| Necesidad | Componente |
|-----------|------------|
| Crear o editar | `FormSheet` |
| Confirmar algo destructivo o irreversible | `StyledModal` con botón `destructive` y verbo concreto ("Eliminar empresa") |
| Error que bloquea y requiere decisión | `StyledModal` |
| Error de carga sin caché | `ErrorState` en la propia pantalla, con "Reintentar" |
| Éxito / acción reversible | `Snackbar`: 4 s, o 6 s si lleva acción ("Deshacer") |
| Error de validación | Texto bajo el campo: `FormField` con `error` (borde del campo en `error` con `inputClassName(isDark, true)`). Se anuncia a TalkBack y desaparece al cambiar el campo |

- Títulos de diálogo sin emojis y sin "Error" genérico: describen lo que pasó
  ("No se pudo guardar la tarea").
- El botón que cierra un diálogo informativo dice "Entendido" o la acción siguiente, no "Aceptar"
  cuando hay algo más específico.

---

## 6. Iconos

- 24 dp en controles, 16–20 dp junto a texto. Color por prop desde un rol.
- Icono con significado o nada: no se añaden iconos para "rellenar" una tarjeta.
- Caracteres como `✕`, `✓`, `▲`/`▼` se sustituyen por iconos SVG de `ActionIcons`.

---

## 7. Checklist al crear o modificar un componente

- [ ] No existe ya uno equivalente en §1.
- [ ] Recibe datos y callbacks por props; no llama a servicios.
- [ ] Estados *pressed*, *focused*, *disabled*, *busy* (DESIGN_SYSTEM §2.4).
- [ ] Rol, etiqueta y estado de accesibilidad; área táctil ≥ 48 dp.
- [ ] Sin hex sueltos; tamaños de la escala fija.
- [ ] Probado en claro, oscuro, fuente al 200 % y ancho ≥ 600 dp.
- [ ] Si sustituye a un patrón duplicado, el estado en §1 pasa de **Objetivo** a **Existe**.
