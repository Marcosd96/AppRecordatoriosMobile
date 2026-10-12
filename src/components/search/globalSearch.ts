import { Company, PersonalTask, Reminder } from '../../types';

export const MAX_RESULTS_PER_GROUP = 20;

const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n',
};

/**
 * Texto en minúsculas y sin tildes, para que "declaracion" encuentre "Declaración"
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[áàäâéèëêíìïîóòöôúùüûñ]/g, c => ACCENTS[c]);
}

/**
 * Cada palabra de la búsqueda debe aparecer en alguno de los campos (en cualquier orden)
 */
function matches(words: string[], fields: Array<string | null | undefined>): boolean {
  const haystack = normalizeText(fields.filter(Boolean).join(' '));
  return words.every(word => haystack.includes(word));
}

export interface SearchData {
  reminders?: Reminder[];
  tasks?: PersonalTask[];
  companies?: Company[];
}

export interface SearchResults {
  reminders: Reminder[];
  tasks: PersonalTask[];
  companies: Company[];
  total: number;
}

const time = (date: Date | string | null | undefined) => (date ? new Date(date).getTime() : 0);

/**
 * Busca en recordatorios, tareas y empresas. Primero lo que sigue pendiente, ordenado por fecha.
 */
export function searchAll(query: string, data: SearchData): SearchResults {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { reminders: [], tasks: [], companies: [], total: 0 };
  }

  const reminders = (data.reminders ?? [])
    .filter(r => matches(words, [r.description, r.companyName, r.type, r.period]))
    .sort(
      (a, b) =>
        Number(a.status === 'completed') - Number(b.status === 'completed') ||
        time(a.dueDate) - time(b.dueDate),
    );

  const tasks = (data.tasks ?? [])
    .filter(t => matches(words, [t.title, t.description]))
    .sort(
      (a, b) =>
        Number(a.status !== 'active') - Number(b.status !== 'active') ||
        time(a.nextOccurrence || a.startDate) - time(b.nextOccurrence || b.startDate),
    );

  const companies = (data.companies ?? [])
    .filter(c => matches(words, [c.name, c.nit]))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return {
    reminders: reminders.slice(0, MAX_RESULTS_PER_GROUP),
    tasks: tasks.slice(0, MAX_RESULTS_PER_GROUP),
    companies: companies.slice(0, MAX_RESULTS_PER_GROUP),
    total: reminders.length + tasks.length + companies.length,
  };
}
