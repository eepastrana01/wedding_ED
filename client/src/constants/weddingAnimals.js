export const WEDDING_ANIMALS = [
  { id: 'pinguino', name: 'Pingüino de Gala', emoji: '🐧', badge: 'Siempre de esmoquin', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { id: 'cisne', name: 'Cisne Elegante', emoji: '🦢', badge: 'Amor eterno y fiel', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'nutria', name: 'Nutria Enamorada', emoji: '🦦', badge: 'Siempre de la mano', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'panda', name: 'Panda Fiestero', emoji: '🐼', badge: 'El primero en la pista', color: 'bg-stone-100 text-stone-900 border-stone-300' },
  { id: 'delfin', name: 'Delfín Bailarín', emoji: '🐬', badge: 'Saltando de emoción', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
  { id: 'koala', name: 'Koala Cariñoso', emoji: '🐨', badge: 'Repartiendo abrazos', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 'colibri', name: 'Colibrí Romántico', emoji: '🕊️', badge: 'Pura ternura y alegría', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  { id: 'flamenco', name: 'Flamenco con Estilo', emoji: '🦩', badge: 'La mejor pose en fotos', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { id: 'leon', name: 'León Sonriente', emoji: '🦁', badge: 'Festejando a lo grande', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'zorro', name: 'Zorro Audaz', emoji: '🦊', badge: 'El alma de la fiesta', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'tiburon', name: 'Tiburón de Pista', emoji: '🦈', badge: 'Baila todas las canciones', color: 'bg-sky-100 text-sky-900 border-sky-300' },
  { id: 'gatito', name: 'Gatito de Etiqueta', emoji: '🐱', badge: 'Felicidad ronroneante', color: 'bg-pink-100 text-pink-900 border-pink-300' },
  { id: 'oso', name: 'Oso Amistoso', emoji: '🐻', badge: 'Abrazo de oso a los novios', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  { id: 'buho', name: 'Búho Sabio', emoji: '🦉', badge: 'Testigo de honor', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  { id: 'canguro', name: 'Canguro Saltarín', emoji: '🦘', badge: 'Saltando en el carnaval', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'mapache', name: 'Mapache Travieso', emoji: '🦝', badge: 'Atento al pastel', color: 'bg-stone-100 text-stone-900 border-stone-300' },
];

export function getRandomWeddingAnimal(currentId = null) {
  const available = currentId 
    ? WEDDING_ANIMALS.filter(a => a.id !== currentId) 
    : WEDDING_ANIMALS;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}
