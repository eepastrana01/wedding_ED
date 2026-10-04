/**
 * Utilidades para normalización y búsqueda de texto insensible a acentos, diacríticos y mayúsculas.
 * Resuelve problemas de tipeo con autocorrector en móviles (ej. José vs Jose, Hernández vs Hernandez, Tíos vs Tios, Cuñados vs Cunados).
 */

/**
 * Normaliza una cadena eliminando acentos, tildes, diacríticos y espacios redundantes.
 * @param {string|any} str
 * @returns {string}
 */
export function normalizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determina si todos los términos de búsqueda (query) están presentes en uno o más textos objetivos.
 * Soporta búsqueda de múltiples palabras en cualquier orden, insensible a acentos y mayúsculas.
 * @param {string|string[]} targets - Texto o arreglo de textos donde buscar (ej. [name, partner_name, family_name])
 * @param {string} query - Lo que el usuario escribió en el input de búsqueda
 * @returns {boolean}
 */
export function matchesSearch(targets, query) {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return true;

  const queryWords = cleanQuery.split(' ').filter(Boolean);
  if (queryWords.length === 0) return true;

  const targetList = Array.isArray(targets) ? targets : [targets];
  const combined = targetList
    .filter((t) => t !== null && t !== undefined)
    .map(normalizeText)
    .join(' ');

  return queryWords.every((word) => combined.includes(word));
}

/**
 * Compara dos cadenas de texto ignorando acentos, mayúsculas y espacios extremos.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function areStringsEqualNormalized(a, b) {
  return normalizeText(a) === normalizeText(b);
}

/**
 * Extrae y unifica grupos únicos de la lista de invitados combinados con los grupos por defecto,
 * deduplicando variaciones ortográficas con/sin tildes (ej. "Tíos" y "Tios").
 * @param {Array} guests
 * @param {Array} defaultGroups
 * @returns {string[]}
 */
export function getAvailableGroups(guests = [], defaultGroups = []) {
  const groupMap = new Map(); // normalizedKey -> originalFormattedString

  // Primero registramos los grupos por defecto
  defaultGroups.forEach((g) => {
    if (g && typeof g === 'string') {
      const norm = normalizeText(g);
      if (norm && !groupMap.has(norm)) {
        groupMap.set(norm, g.trim());
      }
    }
  });

  // Luego incorporamos los grupos que existen en los invitados reales
  guests.forEach((g) => {
    const grp = g?.group_relation?.trim();
    if (grp) {
      const norm = normalizeText(grp);
      if (norm && !groupMap.has(norm)) {
        groupMap.set(norm, grp);
      }
    }
  });

  return Array.from(groupMap.values()).sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' })
  );
}
