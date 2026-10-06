// Ejecutar: node test.mjs
import assert from 'node:assert';
import { ranking, hora } from './logic.js';

const v = {
  desde: 18, hasta: 22, duracion: 60, // 8 bloques: 6pm–10pm
  dias: [{ id: 'lun' }, { id: 'mar' }],
  votos: {
    Ana:  { lun: '11110000', mar: '00001111' },
    Beto: { lun: '00111100', mar: '00002211' },
    Caro: { lun: '00110000' },
  },
};

const [mejor, segunda] = ranking(v);
assert.deepEqual([mejor.dia, mejor.inicio, mejor.si.length], ['lun', 19 * 60, 3]); // 7–8pm: los tres
assert.deepEqual([segunda.dia, segunda.inicio, segunda.si.length], ['mar', 21 * 60, 2]); // 9–10pm: Ana y Beto
assert.ok(ranking(v).every((w, _, a) => a.filter(o => o.dia === w.dia && Math.abs(o.i - w.i) < 2).length === 1), 'sin traslapes');
assert.equal(hora(19 * 60 + 30), '7:30 pm');
assert.equal(hora(12 * 60), '12:00 pm');
console.log('ok');
