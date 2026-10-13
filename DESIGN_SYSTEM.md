# Sistema de diseño — Gesaccol

Fuente única de verdad para colores, tipografía, espaciado y formas de la app.
Complementa a [COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md) (qué componente usar y cómo),
[MOBILE_UX_RULES.md](MOBILE_UX_RULES.md) (comportamiento) y
[ARCHITECTURE.md](ARCHITECTURE.md) (dónde vive cada cosa).

> **Stack**: React Native 0.82 + NativeWind 4 (Tailwind 3). El lenguaje visual sigue
> **Material Design 3** adaptado a RN: no hay Jetpack Compose salvo en el widget nativo
> (`android/.../widget`, XML + Kotlin), que replica estos tokens en `res/values/colors.xml`.

Cada sección distingue:
- **Actual**: lo que el código usa hoy. Es obligatorio respetarlo en código nuevo.
- **Objetivo**: hacia dónde migrar. Se aplica al tocar un archivo, sin reescrituras masivas.

---

## 1. Identidad

Gesaccol es una herramienta de trabajo para contadores: vencimientos fiscales, tareas y
empresas. La interfaz tiene que transmitir **fiabilidad y lectura rápida**, no entretenimiento.

- Sobria: el color comunica estado (vencido, urgente, completado), no decora.
- Densa pero legible: el usuario revisa muchos elementos; priorizamos listas escaneables.
- Predecible: la misma acción tiene el mismo aspecto y lugar en todas las pantallas.

**Rasgos propios** (lo que la distingue de una plantilla genérica; se conservan):
- La **franja lateral de urgencia** en recordatorios: se lee el estado sin leer el texto.
- Fechas **relativas y en lenguaje del dominio** ("vence en 3 días", "debía hacerse el…").
- Azul `primary` sobrio, de herramienta profesional; el resto de la paleta es neutra.

Minimalismo no es ausencia de personalidad: la identidad sale de estas decisiones repetidas
con coherencia, no de efectos visuales.

---

## 2. Color

### 2.1 Roles semánticos

Siempre se razona en **roles**, nunca en "azul" o "rojo". Tabla de equivalencias con la
paleta Tailwind que usa el código hoy:

| Rol (M3)                 | Claro                  | Oscuro                 | Uso |
|--------------------------|------------------------|------------------------|-----|
| `primary`                | `blue-600` `#2563eb`   | `blue-400` `#60a5fa`   | Acción principal, pestaña activa, enlaces |
| `onPrimary`              | `white`                | `gray-900` / `white`¹  | Texto sobre `primary` |
| `primaryContainer`       | `blue-50` / `blue-100` | `blue-500/15`          | Chips/insignias informativas, botón *tonal* |
| `onPrimaryContainer`     | `blue-700`             | `blue-300`             | Texto sobre `primaryContainer` |
| `secondary`              | `gray-700` `#374151`   | `gray-200`             | Texto de acciones secundarias neutras |
| `secondaryContainer`     | `gray-100` `#f3f4f6`   | `gray-700` `#374151`   | Botón secundario ("Calendarios", "Cancelar" en diálogos) |
| `background`             | `gray-50` `#f9fafb`    | `gray-900` `#111827`   | Fondo de pantalla |
| `surface`                | `white`                | `gray-800` `#1f2937`   | Filas, hojas, diálogos |
| `surfaceVariant`         | `gray-100`             | `gray-700`             | Contenedores de icono, campos |
| `onSurface`              | `gray-900` `#111827`   | `white`                | Texto principal |
| `onSurfaceVariant`       | `gray-500` `#6b7280`   | `gray-400` `#9ca3af`   | Texto secundario, iconos inactivos |
| `outline`                | `gray-200` `#e5e7eb`   | `gray-700` `#374151`   | Bordes y divisores |
| `error`                  | `red-600` `#dc2626`    | `red-300`              | Vencido, destructivo, errores |
| `onError`                | `white`                | `white` (sobre `red-600`) | Texto del botón destructivo |
| `errorContainer`         | `red-100`              | `red-500/15`           | Insignia "Vencido" |
| `onErrorContainer`       | `red-800`              | `red-300`              | Texto sobre `errorContainer` |
| `warning` (extensión)    | `amber-700` / `amber-500` | `amber-300`         | Urgente (≤ 7 días) |
| `success` (extensión)    | `green-600`            | `green-300`            | Completado, confirmación |

¹ En oscuro el botón primario conserva `blue-600` con texto blanco: contraste ≥ 4.5:1.

`secondary` es deliberadamente **neutro** (gris), no un segundo color de marca: la app solo
necesita un acento (`primary`) y los colores de estado. Añadir un tono de marca secundario
solo si hay un caso de uso real.

**Colores de categoría** (no son estados): `IVA` → familia `blue`; otros impuestos →
familia `purple`. No añadir categorías nuevas sin revisar contraste en ambos temas.

**Fuera de la paleta**: `yellow`, `orange`, `emerald`, `indigo` y `cyan` no son roles: no
usarlos. `green` solo como `success`. Las insignias usan `StatusBadge`, que solo admite tonos
por rol.

### 2.2 Estados de vencimiento

Se calculan en un único sitio (ver `ReminderCard.tsx`, función de `tone`) y se reutilizan:

| Estado     | Condición                          | Señal |
|------------|------------------------------------|-------|
| `overdue`  | `status = overdue` o días < 0      | `error` + texto "Vencido" |
| `urgent`   | 0 ≤ días ≤ 7                       | `warning` + texto con días |
| `normal`   | días > 7                           | `primary` (franja e insignia) |
| `done`     | completado                         | `onSurfaceVariant`, tachado, opacidad 70 % |

El color **nunca** es la única señal: siempre acompaña un texto ("Vencido", "en 3 días").
La franja y la insignia de un mismo elemento usan **el mismo** estado.

### 2.4 Estados de interacción

| Estado     | Tratamiento |
|------------|-------------|
| *Pressed*  | Capa del color del contenido al 10–12 % (`opacity` 0.88 en el contenedor) o el *ripple* nativo en Android (`android_ripple` de `Pressable`). Sin cambios de escala en filas ni listas |
| *Focused* (teclado/D-pad) | Anillo de 2 dp en `primary` alrededor del control. No eliminar el foco nativo |
| *Disabled* | Contenedor y texto al 38 % de opacidad; `accessibilityState={{ disabled: true }}` |
| *Busy*     | El botón conserva su tamaño, muestra `ActivityIndicator` en lugar del texto y `accessibilityState={{ busy: true }}` |
| *Selected* | Chips y segmentos: relleno `primary` + texto `onPrimary` |

`Button` e `IconButton` aplican *pressed*, *disabled* y *busy*. Usarlos en lugar de componer
botones a mano. **Pendiente**: el indicador de foco por teclado/D-pad; no está verificado que
`Pressable` muestre uno visible en Android, hay que comprobarlo en un dispositivo.

### 2.3 Reglas

- Prohibido escribir hex sueltos en componentes. Para props que no aceptan clases (iconos
  SVG, `ActivityIndicator`, `placeholderTextColor`, `android_ripple`) se usa
  `useThemeColors()` de `src/theme/colors.ts`. Aún quedan literales antiguos (`tabBarStyle`,
  `StyledModal` y el flujo de entrada): se migran al tocar cada archivo.
- **Objetivo**: definir los roles en `tailwind.config.js` (`colors.primary`, `surface`…)
  con variables CSS y usar `dark:` (NativeWind ya tiene `darkMode: 'class'`), para
  eliminar las ternarias `isDark ? 'bg-gray-800' : 'bg-white'` repetidas en cada archivo.
- Contraste mínimo: 4.5:1 texto normal, 3:1 texto ≥ 18 sp o negrita ≥ 14 sp e iconos.
- Los colores del widget (`colors.xml` y `values-night/colors.xml`) deben coincidir con esta
  tabla. Si cambias un rol, cambia ambos.

---

## 3. Tipografía

Fuente del sistema (Roboto en Android, SF en iOS). No se cargan fuentes personalizadas.

| Rol M3          | Clase NativeWind          | Tamaño | Uso |
|-----------------|---------------------------|--------|-----|
| `headlineSmall` | `text-2xl font-bold`      | 24     | Título de pantalla (`ScreenHeader`) |
| `titleMedium`   | `text-lg font-bold`       | 18     | Título de sección, encabezado de hoja |
| `titleSmall`    | `text-base font-semibold` | 16     | Título de un elemento de lista |
| `bodyMedium`    | `text-sm`                 | 14     | Texto secundario, descripciones |
| `labelLarge`    | `text-sm font-semibold`   | 14     | Botones, chips |
| `labelSmall`    | `text-xs font-semibold`   | 12     | Insignias, etiquetas de pestaña |

Reglas:
- Máximo **3 tamaños** por pantalla además del título.
- Pesos permitidos: regular, `font-semibold`, `font-bold`. Nada de `font-black`/`light`.
- Títulos de sección con `accessibilityRole="header"`.
- **Nunca** `allowFontScaling={false}` ni `maxFontSizeMultiplier` < 1.5 en texto de contenido.
- `adjustsFontSizeToFit` solo en controles de ancho fijo (`SegmentedControl`), nunca en párrafos.
- `useResponsive().fontSize` devuelve tamaños **fijos** (ya no crecen con el ancho). Ojo: sus
  nombres no coinciden con Tailwind (`fontSize.sm` = 12, `text-sm` = 14). **Objetivo**: usar
  las clases de la tabla y retirar `fontSize` al migrar cada archivo.
- Encabezados de pantalla compactos: el título no ocupa más de una línea de 24 sp más
  subtítulo. Los tamaños `text-3xl`+ solo en marca (Login, Onboarding).

---

## 4. Espaciado

Rejilla de **4 dp**. Valores permitidos (Tailwind):

| Token | Clase   | dp | Uso típico |
|-------|---------|----|-----------|
| `xs`  | `*-1`   | 4  | Separación icono–texto ajustada |
| `sm`  | `*-2`   | 8  | Entre chips, entre insignias |
| `md`  | `*-4`   | 16 | Relleno interno de filas y hojas |
| `lg`  | `*-6`   | 24 | Margen horizontal de pantalla en móvil |
| `xl`  | `*-8`   | 32 | Separación entre bloques grandes |

- Margen horizontal de pantalla: 16 dp (compacto), 24 dp (mediano/expandido).
- Evitar valores intermedios (`p-3.5`, `mt-1.5`) salvo alineación óptica justificada.
- `useResponsive().spacing` es fijo (4, 8, 16, 24, 32…). En pantallas grandes se gana espacio
  con layout (columnas, ancho máximo, `windowClass`), no inflando márgenes.
- Proximidad: elementos relacionados a 4–8 dp; grupos distintos a 16–24 dp. La separación
  comunica la relación; no se iguala todo "por limpieza".

---

## 5. Formas

| Token M3       | Clase          | Radio | Uso |
|----------------|----------------|-------|-----|
| `extraSmall`   | `rounded`      | 4     | Barras de gráfico |
| `small`        | `rounded-lg`   | 8     | Campos de texto |
| `medium`       | `rounded-xl`   | 12    | Botones, campos, controles segmentados |
| `large`        | `rounded-2xl`  | 16    | Contenedores de lista, estados vacíos |
| `extraLarge`   | `rounded-t-3xl`| 28    | Borde superior de hojas inferiores |
| `full`         | `rounded-full` | —     | Chips, insignias, FAB, aviso sin conexión |

No mezclar radios distintos en elementos hermanos. Un elemento anidado lleva un radio
**menor** que su contenedor.

## 6. Elevación

Por defecto **sin sombra**. Las superficies se separan con `outline` (borde de 1 dp) y
cambio de tono de superficie, como en M3 con tonal elevation.

Sombra/elevación cuando hay **superposición real**: hoja inferior, diálogo, FAB, menú.
En filas de lista o tarjetas estáticas no aporta información; si se usa, hay que justificar
qué comunica. El *scrim* de diálogos y hojas es `black/50`.

---

## 7. Iconografía

- SVG propios en `src/components/icons/` (`TabIcons`, `ActionIcons`, `BrandIcons`).
  Estilo de trazo, 24 dp por defecto, 16–20 dp dentro de texto.
- El color se recibe por prop (`color`) desde el rol correspondiente.
- **Prohibido usar emojis como iconos** de botones o estados (p. ej. "🔍 Diagnosticar").
- Icono sin texto ⇒ `accessibilityLabel` obligatorio.

---

## 8. Componentes

El catálogo, los contratos y las reglas de uso de cada componente están en
[COMPONENT_GUIDELINES.md](COMPONENT_GUIDELINES.md). Este documento solo fija los tokens que
esos componentes consumen.

---

## 9. Movimiento

- Duraciones: 150 ms (micro, pulsación), 250 ms (entrada de hoja/diálogo), 300 ms (navegación).
- El movimiento explica una transición (aparece la hoja desde abajo); no se anima por decorar.
- Transiciones de navegación: las nativas de la plataforma (`AppNavigator` no define
  interpoladores propios).
- Splash: `SplashScreen` es estático, continúa el fondo del splash nativo y solo se ve
  mientras se restaura la sesión. Ninguna animación de marca retrasa el arranque.
- Sin animaciones de entrada decorativas (logos que escalan, textos que suben): se
  retiraron de Login, Onboarding y Permisos.
- Respetar "Reducir movimiento": `AccessibilityInfo.isReduceMotionEnabled()` ⇒ sin escalas
  ni rebotes, solo fundidos.

---

## 10. Checklist de revisión visual

- [ ] Sin hex sueltos nuevos; colores por rol.
- [ ] Probado en tema claro y oscuro.
- [ ] Probado con fuente del sistema al 200 %.
- [ ] Sin sombras, gradientes ni transparencias decorativas (o justificadas por escrito).
- [ ] Componentes existentes reutilizados (COMPONENT_GUIDELINES).
- [ ] Estados *pressed*, *focused*, *disabled* y *busy* visibles en cada control nuevo.
- [ ] Probado en ancho ≥ 600 dp y en horizontal.
- [ ] Si cambió un color de rol, actualizado también el widget (`colors.xml`).
