// lib/names.ts
const ADJ = ['Silver','Crimson','Azure','Golden','Swift','Silent','Brave','Clever','Cosmic','Velvet','Neon','Lunar','Solar','Misty','Rapid'];
const Noun = ['Falcon','Panda','Tiger','Otter','Phoenix','Wolf','Koala','Dolphin','Leopard','Hawk','Mantis','Orca','Viper','Raven','Lynx'];

export function randomAnonName(seed?: string) {
  // simple seeded-ish pick
  const h = [...(seed ?? (Math.random()*1e9).toString())].reduce((a,c)=> (a*31 + c.charCodeAt(0))>>>0, 0);
  const a = ADJ[h % ADJ.length];
  const n = Noun[(h >> 8) % Noun.length];
  return `${a} ${n}`;
}
