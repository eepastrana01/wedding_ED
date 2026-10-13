// Clasificador de género determinista y preciso para los invitados de la boda
import { normalizeText } from './textUtils';

const FEMALE_NAMES = new Set([
  'abigail', 'alba', 'alejandra', 'ana', 'andrea', 'blanca', 'britney', 'catalina',
  'celina', 'cinthia', 'cynthia', 'clementina', 'crucita', 'daniela', 'dania',
  'dayanary', 'denia', 'dilcia', 'dirling', 'emely', 'emily', 'emilia', 'gabriela',
  'genesis', 'giselle', 'gisselle', 'hazel', 'irene', 'irma', 'isabela', 'isabella',
  'juana', 'karen', 'karina', 'kathy', 'laura', 'llamaly', 'lorena', 'lourdes',
  'madison', 'margarita', 'maribel', 'meylin', 'michelle', 'olga', 'orfilia',
  'paty', 'patricia', 'reina', 'reyna', 'rosa', 'saida', 'shirley', 'sonia',
  'suamy', 'susan', 'susana', 'suyapa', 'yarleny', 'yugeny', 'maria', 'carmen',
  'lucia', 'elena', 'valeria', 'camila', 'claudia', 'monica', 'paola', 'natalia',
  'victoria', 'adriana', 'vanessa', 'jessica', 'kirstin', 'johanna', 'kitty',
  'dona', 'clemen', 'esposa', 'mama', 'novia'
]);

const MALE_NAMES = new Set([
  'adolfo', 'adonay', 'alexander', 'alexis', 'alfonso', 'angel', 'anthony', 'brandon',
  'carlitos', 'carlos', 'cesar', 'daniel', 'david', 'diego', 'edgar', 'eli', 'eduardo',
  'enrique', 'ethan', 'francisco', 'gabriel', 'henry', 'jeison', 'jason', 'jonathan',
  'jose', 'juan', 'julio', 'kenneth', 'kevin', 'luis', 'mario', 'marlon',
  'miguel', 'miguelito', 'misael', 'nelson', 'obed', 'patricio', 'rafael', 'roberto',
  'romel', 'santos', 'tano', 'victor', 'walter', 'yamil', 'arnold', 'jonty', 'kit',
  'pedro', 'pablo', 'jorge', 'manuel', 'fernando', 'ricardo', 'javier', 'sergio',
  'hector', 'ruben', 'oscar', 'hugo', 'gustavo', 'ramon', 'raul', 'arturo',
  'don', 'rey', 'novio'
]);

export function detectGuestGender(guest) {
  if (!guest) return 'man';

  // 1. Verificar si hay un override manual guardado por el usuario
  const override = localStorage.getItem(`wedding_guest_gender_${guest.id}`);
  if (override === 'woman' || override === 'man') {
    return override;
  }

  const rawName = guest.name || '';
  const normalized = normalizeText(rawName).trim().toLowerCase();
  if (!normalized) return 'man';

  // 2. Prefijos explícitos de parentesco
  if (
    normalized.startsWith('dona ') || 
    normalized.startsWith('mama ') || 
    normalized.startsWith('esposa ') ||
    normalized.startsWith('novia ') ||
    normalized.includes('clemen')
  ) {
    return 'woman';
  }

  if (
    normalized.startsWith('don ') || 
    normalized.startsWith('papa ') || 
    normalized.startsWith('novio ')
  ) {
    return 'man';
  }

  // 3. Evaluar primer nombre
  const tokens = normalized.split(/\s+/);
  const firstName = tokens[0];

  if (FEMALE_NAMES.has(firstName)) {
    return 'woman';
  }

  if (MALE_NAMES.has(firstName)) {
    return 'man';
  }

  // Si tiene segundo nombre (ej. Carlos Daniel -> hombre, Juan Pablo -> hombre, Ana María -> mujer)
  if (tokens.length > 1) {
    const secondName = tokens[1];
    if (FEMALE_NAMES.has(secondName) && !MALE_NAMES.has(firstName)) {
      return 'woman';
    }
  }

  // 4. Regla heurística en español: terminación en 'a' suele ser femenino
  if (firstName.endsWith('a') && !MALE_NAMES.has(firstName)) {
    return 'woman';
  }

  return 'man';
}

export function setGuestGenderOverride(guestId, gender) {
  if (!guestId) return;
  localStorage.setItem(`wedding_guest_gender_${guestId}`, gender);
}
