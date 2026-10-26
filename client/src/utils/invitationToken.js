// Utilidad para firmar, comprimir y verificar enlaces cortos de invitación digital (/i/...)
// Evita que un invitado modifique la cantidad de pases o el nombre en la URL,
// mantiene 0 consultas a Neon DB y reduce el tamaño del enlace a más de la mitad.

const SECRET_SALT = 'BodaEdisDania_21Nov2026_CalanPark';

// Diccionario de frases frecuentes en tarjetas de boda para comprimir a 1 solo byte
const DICT_PHRASES = [
  ['\x01', 'Familia '],
  ['\x02', ' y Familia'],
  ['\x03', ' y Esposa'],
  ['\x04', ' y Esposo'],
  ['\x05', ' e Hijos'],
  ['\x06', ' y Pareja'],
  ['\x07', ' y Acompañante'],
  ['\x08', 'Invitado Especial'],
  ['\x09', 'Sr. y Sra. '],
  ['\x0b', ' e Hija'],
  ['\x0c', ' e Hijo'],
  ['\x0e', 'Sr. '],
  ['\x0f', 'Sra. '],
];

function compressSalutation(str) {
  let out = str;
  for (const [code, phrase] of DICT_PHRASES) {
    out = out.split(phrase).join(code);
  }
  return out;
}

function decompressSalutation(str) {
  let out = str;
  for (const [code, phrase] of DICT_PHRASES) {
    out = out.split(code).join(phrase);
  }
  return out;
}

// Firma legacy v1 (10 caracteres base36) — se conserva para compatibilidad con enlaces anteriores
function computeSignatureV1(cardId, salutation, seats) {
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

// Firma compacta v2 de 24 bits (3 bytes = 16.7 millones de combinaciones por tarjeta)
function computeSignature24(cardId, salutation, seats) {
  const raw = `v2|${cardId}|${salutation}|${seats}|${SECRET_SALT}`;
  let h1 = 0x9e3779b9 ^ raw.length;
  let h2 = 0x85ebca6b ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return (h1 >>> 8) & 0xffffff;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Genera un token binario ultra-corto y firmado (v2) para enlaces /i/<token>
 */
export function encodeInvitationToken(card) {
  if (!card) return '';
  const cId = String(card.id || '');
  const sal = String(card.salutation || card.title || 'Invitado Especial');
  const sts = Math.max(1, Number(card.seats) || 1);

  // Intentar empaquetado binario v2 ultra-compacto (soporta fam-N / guest-N hasta ID 131071 y hasta 32 pases)
  const match = /^(fam|guest)-(\d+)$/.exec(cId);
  if (match && sts <= 32) {
    const isFamily = match[1] === 'fam' ? 1 : 0;
    const numId = Number(match[2]);
    if (numId >= 0 && numId <= 0x1ffff) {
      // 24 bits header: [bit23 = 1 (v2)] [bit22 = isFamily] [bits21..17 = seats-1 (5 bits)] [bits16..0 = numId (17 bits)]
      const header24 =
        ((0x80 | (isFamily << 6) | ((sts - 1) << 1) | ((numId >>> 16) & 1)) << 16) |
        (numId & 0xffff);
      const sig24 = computeSignature24(cId, sal, sts);
      const nameBytes = new TextEncoder().encode(compressSalutation(sal));

      const out = new Uint8Array(6 + nameBytes.length);
      out[0] = (header24 >>> 16) & 0xff;
      out[1] = (header24 >>> 8) & 0xff;
      out[2] = header24 & 0xff;
      out[3] = (sig24 >>> 16) & 0xff;
      out[4] = (sig24 >>> 8) & 0xff;
      out[5] = sig24 & 0xff;
      out.set(nameBytes, 6);

      return bytesToBase64Url(out);
    }
  }

  // Fallback v1 JSON por si existiera un ID no estándar o >32 pases
  const sig = computeSignatureV1(cId, sal, sts);
  const payload = JSON.stringify({ c: cId, n: sal, s: sts, h: sig });
  return bytesToBase64Url(new TextEncoder().encode(payload));
}

/**
 * Decodifica y verifica tanto los nuevos tokens cortos v2 (/i/...) como los anteriores v1 (?k=...)
 */
export function decodeInvitationToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const bytes = base64UrlToBytes(token.trim());
    if (bytes.length < 6) return null;

    // Formato v2 binario ultra-corto (bit 7 del byte 0 activo: >= 0x80)
    if ((bytes[0] & 0x80) !== 0) {
      const b0 = bytes[0];
      const isFamily = ((b0 >>> 6) & 1) === 1;
      const seats = ((b0 >>> 1) & 0x1f) + 1;
      const numId = ((b0 & 1) << 16) | (bytes[1] << 8) | bytes[2];
      const sig24 = (bytes[3] << 16) | (bytes[4] << 8) | bytes[5];

      const cardId = `${isFamily ? 'fam' : 'guest'}-${numId}`;
      const salutation =
        decompressSalutation(new TextDecoder().decode(bytes.subarray(6))) || 'Invitado Especial';

      const expectedSig = computeSignature24(cardId, salutation, seats);
      if (sig24 !== expectedSig) {
        return null; // Token alterado
      }

      return { cardId, salutation, seats };
    }

    // Formato legacy v1 JSON (empieza con '{' = 0x7b)
    const jsonStr = new TextDecoder().decode(bytes);
    const data = JSON.parse(jsonStr);
    if (!data || !data.c || !data.h) return null;
    const expectedSig = computeSignatureV1(String(data.c), String(data.n || ''), Number(data.s) || 1);
    if (data.h !== expectedSig) {
      return null;
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

/**
 * Extrae el token desde la ruta corta /i/<token> o desde ?k=<token> (compatibilidad total)
 */
export function extractInvitationTokenFromWindow() {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname || '';
  if (path.startsWith('/i/') && path.length > 3) {
    const slug = path.slice(3).split('/')[0];
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }
  return new URLSearchParams(window.location.search).get('k') || '';
}

const ADMIN_STORAGE_KEY = 'wedding_ed_admin_unlocked';

/**
 * Verifica si el dispositivo actual tiene desbloqueado el Panel de Administración.
 */
export function checkAndPersistAdminAccess() {
  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

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
    window.history.replaceState({}, '', '/');
    return true;
  }

  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
