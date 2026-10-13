/** Mensaje para el usuario: título que dice qué pasó y explicación */
export interface UserMessage {
  title: string;
  message: string;
}

/**
 * Resultado de una acción de un hook de pantalla. La pantalla decide cómo mostrarlo:
 * los éxitos con snackbar (o el propio cambio en la lista) y los errores en un diálogo.
 */
export type ActionResult = { ok: true } | { ok: false; error: UserMessage };

export const failure = (title: string, error: unknown, fallback: string): ActionResult => ({
  ok: false,
  error: { title, message: (error as Error)?.message || fallback },
});
