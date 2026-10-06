// Lógica pura (sin DOM ni red) para poder probarla con `node test.mjs`.
// Votos de una persona: { [diaId]: "0120..." } — un carácter por bloque de 30 min.
// '0' = no, '1' = disponible, '2' = si es necesario.

export const PASO = 30;
export const FRANJAS = { Mañana: [9, 12], Tarde: [12, 18], Noche: [18, 23] };

export const bloques = (v) => (v.hasta - v.desde) * 60 / PASO;
export const minuto = (v, i) => v.desde * 60 + i * PASO;

export function hora(m) {
  const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
  return `${(h + 11) % 12 + 1}:${mm} ${h % 24 < 12 ? 'am' : 'pm'}`;
}

// Solo cuenta como votante quien marcó al menos un bloque (marcar y luego borrar todo = no votó).
export const votantes = (v) => Object.keys(v.votos || {}).filter((p) => Object.values(v.votos[p]).some((s) => /[12]/.test(s)));

// Quién puede en una ventana [i, i+n): todos los bloques en 1 → sí; con algún 2 → si es necesario; algún 0 → no.
export function ventana(v, diaId, i, n) {
  const si = [], quiza = [], no = [];
  for (const p of votantes(v)) {
    const s = (v.votos[p][diaId] || '').slice(i, i + n).padEnd(n, '0');
    (s.includes('0') ? no : s.includes('2') ? quiza : si).push(p);
  }
  return { dia: diaId, inicio: minuto(v, i), i, si, quiza, no, puntaje: si.length + quiza.length / 2 };
}

// Mejores ventanas de `duracion` minutos, sin traslapes en el mismo día.
export function ranking(v, k = 5) {
  const n = v.duracion / PASO, total = bloques(v), todas = [];
  for (const d of v.dias) for (let i = 0; i + n <= total; i++) todas.push(ventana(v, d.id, i, n));
  todas.sort((a, b) => b.puntaje - a.puntaje || b.si.length - a.si.length);
  const elegidas = [];
  for (const w of todas) {
    if (elegidas.length === k || w.puntaje === 0) break;
    if (!elegidas.some(e => e.dia === w.dia && Math.abs(e.i - w.i) < n)) elegidas.push(w);
  }
  return elegidas;
}
