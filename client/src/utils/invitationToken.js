// Utilidad para firmar y verificar enlaces de invitación digital
// Evita que un invitado modifique la cantidad de pases o el nombre en la URL
// o adivine consecutivos como fam-51, fam-52, etc.

const SECRET_SALT = 'BodaEdisDania_21Nov2026_CalanPark';

function computeSignature(cardId, salutation, seats) {
  const raw = `${cardId}|${salutation}|${seats}|${SECRET_SALT}`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(36) + (h1 >>> 0).toString(36)).slice(0, 10);
}

function toBase64Url(str) {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Genera un token firmado e inalterable para el enlace de una tarjeta de invitación
 */
export function encodeInvitationToken(card) {
  if (!card) return '';
  const cId = String(card.id || '');
  const sal = String(card.salutation || card.title || 'Invitado Especial');
  const sts = Number(card.seats) || 1;
  const sig = computeSignature(cId, sal, sts);
  const payload = JSON.stringify({ c: cId, n: sal, s: sts, h: sig });
  return toBase64Url(payload);
}

/**
 * Decodifica y verifica la firma del token de invitación.
 * Si el usuario intentó alterar el token en la URL, devuelve null.
 */
export function decodeInvitationToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const jsonStr = fromBase64Url(token.trim());
    const data = JSON.parse(jsonStr);
    if (!data || !data.c || !data.h) return null;
    const expectedSig = computeSignature(String(data.c), String(data.n || ''), Number(data.s) || 1);
    if (data.h !== expectedSig) {
      return null; // Token alterado
    }
    return {
      cardId: String(data.c),
      salutation: String(data.n || 'Invitado Especial'),
      seats: Number(data.s) || 1,
    };
  } catch {
    return null;
  }
}

const ADMIN_STORAGE_KEY = 'wedding_ed_admin_unlocked';

/**
 * Verifica si el dispositivo actual tiene desbloqueado el Panel de Administración.
 * Si el usuario entra a /panel-edis (o ?llave=edis), desbloquea permanentemente este navegador.
 */
export function checkAndPersistAdminAccess() {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  // Rutas secretas para desbloquear el panel en un dispositivo nuevo
  const isUnlockRoute =
    pathname === '/panel-edis' ||
    pathname === '/panel-ed' ||
    pathname === '/admin-edis' ||
    params.get('panel') === 'edis' ||
    params.get('llave') === 'edis';

  if (isUnlockRoute) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    } catch {}
    // Limpiar la URL para que quede en "/" ya dentro del panel
    window.history.replaceState({}, '', '/');
    return true;
  }

  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
