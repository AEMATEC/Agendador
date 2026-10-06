import config from './config.js';
import { FRANJAS, PASO, bloques, minuto, hora, ventana, ranking } from './logic.js';

const $ = (s) => document.querySelector(s);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const local = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const fallo = (e) => { app.innerHTML = `<p class="error">Error de conexión: ${esc(e.message)}</p>`; };
const esAdmin = () => local.get('clave') === config.claveAdmin;
const DEMO = !config.firebase.apiKey;

// ---------- Almacenamiento: Firestore, o localStorage en modo demo (misma interfaz) ----------

async function firestore() {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const { initializeApp } = await import(base + 'firebase-app.js');
  const f = await import(base + 'firebase-firestore.js');
  const col = f.collection(f.getFirestore(initializeApp(config.firebase)), 'votaciones');
  const ref = (id) => f.doc(col, id);
  const conId = (d) => ({ id: d.id, ...d.data() });
  return {
    lista: (cb) => f.onSnapshot(f.query(col, f.orderBy('creada', 'desc')), (s) => cb(s.docs.map(conId)), fallo),
    ver: (id, cb) => f.onSnapshot(ref(id), (d) => cb(d.exists() ? conId(d) : null), fallo),
    crear: (v) => f.addDoc(col, v).then((r) => r.id),
    votar: (id, nombre, dias) => f.updateDoc(ref(id), new f.FieldPath('votos', nombre), dias),
    editar: (id, campos) => f.updateDoc(ref(id), campos),
    borrar: (id) => f.deleteDoc(ref(id)),
  };
}

function demo() {
  const leer = () => JSON.parse(local.get('agendador-demo') || '{}');
  const subs = new Set();
  const guardar = (todo) => { local.set('agendador-demo', JSON.stringify(todo)); subs.forEach((f) => f()); };
  const sub = (f) => (subs.add(f), f(), () => subs.delete(f));
  addEventListener('storage', () => subs.forEach((f) => f()));
  const cambiar = async (id, fn) => { const todo = leer(); fn(todo, todo[id]); guardar(todo); };
  return {
    lista: (cb) => sub(() => cb(Object.entries(leer()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.creada - a.creada))),
    ver: (id, cb) => sub(() => { const v = leer()[id]; cb(v ? { id, ...v } : null); }),
    crear: async (v) => { const id = Date.now().toString(36); await cambiar(id, (todo) => { todo[id] = v; }); return id; },
    votar: (id, nombre, dias) => cambiar(id, (_, v) => { v.votos[nombre] = dias; }),
    editar: (id, campos) => cambiar(id, (_, v) => Object.assign(v, campos)),
    borrar: (id) => cambiar(id, (todo) => { delete todo[id]; }),
  };
}

const db = DEMO ? demo() : await firestore();

// ---------- Utilidades de presentación ----------

const etiqueta = (v, diaId) => v.dias.find((d) => d.id === diaId)?.label ?? diaId;
const rango = (v, w) => `${etiqueta(v, w.dia)} · ${hora(w.inicio)} – ${hora(w.inicio + v.duracion)}`;
const duracionTxt = (m) => `${String(m / 60).replace('.', ',')} h`;
const aviso = DEMO ? '<p class="demo"><b>Modo demo:</b> los votos solo se guardan en este navegador. Configura Firebase en <code>config.js</code> para usarlo con la junta.</p>' : '';

function gcal(v) {
  const { dia, inicio } = v.cerrada;
  const f = (m) => `${dia.replaceAll('-', '')}T${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(v.titulo)}&dates=${f(inicio)}/${f(inicio + v.duracion)}&ctz=America/Costa_Rica`;
}

function final(v) {
  if (!v.cerrada) return '';
  const fecha = /^\d{4}-/.test(v.cerrada.dia);
  return `<div class="final">Sesión fijada: <b>${esc(rango(v, v.cerrada))}</b>${fecha ? `<br><a href="${gcal(v)}" target="_blank" rel="noopener">Agregar a Google Calendar</a>` : ''}</div>`;
}

// ---------- Vista: inicio ----------

function inicio() {
  const item = (v) => `<li><a href="#/v/${v.id}"><b>${esc(v.titulo)}</b><span>${
    v.cerrada ? esc(rango(v, v.cerrada)) : `${esc(v.dias[0].label)} → ${esc(v.dias.at(-1).label)} · ${Object.keys(v.votos || {}).length} votos`
  }</span></a></li>`;
  return db.lista((vs) => {
    const abiertas = vs.filter((v) => !v.cerrada).map(item).join('');
    const cerradas = vs.filter((v) => v.cerrada).map(item).join('');
    app.innerHTML = `${aviso}
      ${esAdmin() ? '<a class="btn" href="#/nueva">+ Nueva votación</a>' : ''}
      <h2>Votaciones abiertas</h2>
      ${abiertas ? `<ul class="lista">${abiertas}</ul>` : '<p class="muted">No hay votaciones abiertas.</p>'}
      <h2>Sesiones fijadas</h2>
      ${cerradas ? `<ul class="lista">${cerradas}</ul>` : '<p class="muted">Todavía ninguna.</p>'}
      ${esAdmin() ? '' : '<button class="link" id="admin">Soy de secretaría / presidencia</button>'}`;
    $('#admin')?.addEventListener('click', () => {
      const c = prompt('Clave de administración');
      if (c === config.claveAdmin) { local.set('clave', c); ruta(); } else if (c !== null) alert('Clave incorrecta');
    });
  });
}

// ---------- Vista: nueva votación (admin) ----------

const SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const iso = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local

function nueva() {
  const hoy = new Date(), lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + ((8 - hoy.getDay()) % 7 || 7));
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  const horas = (sel) => Array.from({ length: 25 }, (_, h) => `<option value="${h}"${h === sel ? ' selected' : ''}>${hora(h * 60)}</option>`).join('');
  app.innerHTML = `${aviso}<a href="#/">← Volver</a><h1>Nueva votación</h1>
    <form id="f" class="card">
      <label>Título</label><input name="titulo" value="Sesión de Junta Directiva" required maxlength="80">
      <label>Tipo</label>
      <select name="modo"><option value="fechas">Fechas específicas</option><option value="semana">Horario semanal fijo (Lunes a Domingo)</option></select>
      <div class="fila" id="fechas">
        <div><label>Desde</label><input type="date" name="ini" value="${iso(lunes)}"></div>
        <div><label>Hasta (máx. 7 días)</label><input type="date" name="fin" value="${iso(domingo)}"></div>
      </div>
      <div class="fila">
        <div><label>Duración</label><select name="duracion"><option value="60">1 h</option><option value="90">1,5 h</option><option value="120" selected>2 h</option></select></div>
        <div><label>Desde las</label><select name="desde">${horas(9)}</select></div>
        <div><label>Hasta las</label><select name="hasta">${horas(23)}</select></div>
      </div>
      <p id="err" class="error"></p>
      <button>Crear y compartir</button>
    </form>`;
  const f = $('#f');
  f.modo.onchange = () => { $('#fechas').hidden = f.modo.value === 'semana'; };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const desde = +f.desde.value, hasta = +f.hasta.value, duracion = +f.duracion.value;
    let dias;
    if (f.modo.value === 'semana') {
      dias = SEMANA.map((label) => ({ id: label.slice(0, 3).toLowerCase(), label }));
    } else {
      dias = [];
      for (let d = new Date(f.ini.value + 'T12:00'); iso(d) <= f.fin.value && dias.length < 8; d.setDate(d.getDate() + 1)) {
        const label = d.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
        dias.push({ id: iso(d), label: label[0].toUpperCase() + label.slice(1) });
      }
    }
    const err = !dias.length ? 'Revisa las fechas.' : dias.length > 7 ? 'Máximo 7 días por votación.'
      : (hasta - desde) * 60 < duracion ? 'El rango de horas es más corto que la duración.' : '';
    if (err) { $('#err').textContent = err; return; }
    const id = await db.crear({ titulo: f.titulo.value.trim(), dias, desde, hasta, duracion, votos: {}, cerrada: null, creada: Date.now() });
    location.hash = `#/v/${id}`;
  };
  return () => {};
}

// ---------- Vista: votación ----------

function votacion(id) {
  let v, yo = local.get('nombre'), mio = null, tab = 'votar', pincel = '1', pintando = false, sel = null;
  const ac = new AbortController();

  const cargarMio = () => { mio = { ...(v.votos?.[yo] || {}) }; };
  const poner = (dia, i, val) => {
    const s = (mio[dia] || '').padEnd(bloques(v), '0');
    mio[dia] = s.slice(0, i) + val + s.slice(i + 1);
  };
  const guardar = () => {
    $('#estado') && ($('#estado').textContent = 'Guardando…');
    db.votar(id, yo, mio).then(() => $('#estado') && ($('#estado').textContent = 'Guardado ✓'), (e) => alert('No se pudo guardar: ' + e.message));
  };

  function grilla(modo) {
    const n = bloques(v), total = Object.keys(v.votos || {}).length || 1;
    const editable = modo === 'votar' && !v.cerrada;
    let h = `<div class="grid ${modo}" style="--d:${v.dias.length}"><div class="dh"></div>`;
    for (const d of v.dias) {
      h += `<div class="dh">${esc(d.label)}${editable ? `<div class="fr">${Object.keys(FRANJAS)
        .map((f) => `<button data-franja="${f}" data-dia="${d.id}" title="Marcar ${f.toLowerCase()}" aria-label="${f} del ${esc(d.label)}">${f[0]}</button>`).join('')}</div>` : ''}</div>`;
    }
    for (let i = 0; i < n; i++) {
      const m = minuto(v, i), hr = i % 2 ? ' hr' : '';
      h += `<div class="t">${m % 60 ? '' : hora(m).replace(':00', '')}</div>`;
      for (const d of v.dias) {
        if (modo === 'votar') { h += `<div class="c${hr}" data-dia="${d.id}" data-i="${i}" data-v="${(mio[d.id] || '')[i] || '0'}"></div>`; continue; }
        const w = ventana(v, d.id, i, 1), a = w.puntaje / total;
        h += `<div class="h${hr}${sel === `${d.id}|${i}` ? ' sel' : ''}" data-dia="${d.id}" data-i="${i}" style="background:rgb(0 121 138 / ${a});color:${a > 0.55 ? '#fff' : 'inherit'}">${w.puntaje ? w.si.length + (w.quiza.length ? `+${w.quiza.length}` : '') : ''}</div>`;
      }
    }
    return h + '</div>';
  }

  function resultados() {
    const personas = Object.keys(v.votos || {});
    if (!personas.length) return '<p class="muted">Todavía nadie ha votado.</p>';
    const faltan = config.miembros.filter((m) => !personas.includes(m));
    const top = ranking(v);
    const op = (w) => `<li><b>${esc(rango(v, w))}</b>
      <span>${w.si.length} de ${personas.length} pueden${w.quiza.length ? ` · ${w.quiza.length} si es necesario` : ''}</span>
      ${w.quiza.length ? `<small>Si es necesario: ${w.quiza.map(esc).join(', ')}</small>` : ''}
      ${w.no.length ? `<small>No pueden: ${w.no.map(esc).join(', ')}</small>` : ''}
      ${esAdmin() && !v.cerrada ? `<button data-fijar="${w.dia}|${w.inicio}">Fijar este horario</button>` : ''}</li>`;
    return `<p class="muted">Votaron (${personas.length}): ${personas.map(esc).join(', ')}${faltan.length ? `<br>Faltan: <b>${faltan.map(esc).join(', ')}</b>` : ''}</p>
      <h2>Mejores opciones de ${duracionTxt(v.duracion)}</h2>
      ${top.length ? `<ol class="opciones">${top.map(op).join('')}</ol>` : '<p class="muted">No hay ningún espacio en común todavía.</p>'}
      <h2>Mapa de disponibilidad</h2><p class="muted">Número = personas disponibles (+ si es necesario). Toca un bloque para ver nombres.</p>
      <div id="detalle"></div>${grilla('calor')}`;
  }

  function quienSoy() {
    const nombres = [...new Set([...config.miembros, ...Object.keys(v.votos || {})])];
    return `<div class="card"><b>¿Quién eres?</b>
      ${nombres.length ? `<div class="chips">${nombres.map((n) => `<button class="chip" data-nombre="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
      <form id="fn" class="fila" style="margin-top:8px"><input name="n" placeholder="Tu nombre" required maxlength="40"><button style="flex:0">Entrar</button></form></div>`;
  }

  function render() {
    if (!v) { app.innerHTML = '<a href="#/">← Volver</a><p>Esta votación no existe o fue borrada.</p>'; return; }
    const votos = Object.keys(v.votos || {}).length;
    app.innerHTML = `${aviso}<a href="#/">← Volver</a>
      <h1>${esc(v.titulo)}</h1>
      <p class="muted">Sesión de ${duracionTxt(v.duracion)} · entre ${hora(v.desde * 60)} y ${hora(v.hasta * 60)}
        · <button class="link" id="copiar" style="margin:0">Copiar enlace</button></p>
      ${final(v)}
      ${!yo ? quienSoy() : `
        <p class="muted">Votando como <b>${esc(yo)}</b> · <button class="link" id="cambiar" style="margin:0">cambiar</button></p>
        <div class="tabs"><button data-tab="votar" class="${tab === 'votar' ? 'on' : ''}">Mi disponibilidad</button>
          <button data-tab="res" class="${tab === 'res' ? 'on' : ''}">Resultados (${votos})</button></div>
        ${tab === 'res' ? resultados() : `
          ${v.cerrada ? '' : `<div class="pinceles">
            <button data-pincel="1" class="${pincel === '1' ? 'on' : ''}"><i class="muestra si"></i>Puedo</button>
            <button data-pincel="2" class="${pincel === '2' ? 'on' : ''}"><i class="muestra quiza"></i>Si es necesario</button>
            <span id="estado" class="muted"></span></div>
            <p class="muted">Toca o arrastra sobre los bloques. <b>M / T / N</b> marca toda la mañana, tarde o noche. Para hacer scroll en el celular, desliza sobre la columna de horas.</p>`}
          ${grilla('votar')}`}`}
      ${esAdmin() ? `<p style="margin-top:32px">${v.cerrada ? '<button class="sec" id="reabrir">Reabrir votación</button> ' : ''}<button class="peligro" id="borrar">Borrar votación</button></p>` : ''}`;
  }

  // Eventos delegados: se registran una vez y sobreviven a los re-render.
  const on = (tipo, fn) => app.addEventListener(tipo, fn, { signal: ac.signal });
  on('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.nombre) { yo = t.dataset.nombre; local.set('nombre', yo); cargarMio(); }
    else if (t.id === 'cambiar') { yo = null; }
    else if (t.dataset.tab) { tab = t.dataset.tab; }
    else if (t.dataset.pincel) { pincel = t.dataset.pincel; }
    else if (t.id === 'copiar') { navigator.clipboard.writeText(location.href).then(() => { t.textContent = 'Enlace copiado ✓'; }); return; }
    else if (t.dataset.franja) {
      const [a, b] = FRANJAS[t.dataset.franja], dia = t.dataset.dia;
      const desde = Math.max(0, (a - v.desde) * 60 / PASO), hasta = Math.min(bloques(v), (b - v.desde) * 60 / PASO);
      const lleno = [...(mio[dia] || '').padEnd(bloques(v), '0').slice(desde, hasta)].every((c) => c === pincel);
      for (let i = desde; i < hasta; i++) poner(dia, i, lleno ? '0' : pincel);
      guardar();
    } else if (t.dataset.fijar) {
      const [dia, inicio] = t.dataset.fijar.split('|');
      if (confirm(`¿Fijar la sesión el ${rango(v, { dia, inicio: +inicio })}?`)) db.editar(id, { cerrada: { dia, inicio: +inicio } });
      return;
    } else if (t.id === 'reabrir') { db.editar(id, { cerrada: null }); return; }
    else if (t.id === 'borrar') {
      if (confirm('¿Borrar esta votación y todos sus votos?')) db.borrar(id).then(() => { location.hash = '#/'; });
      return;
    } else return;
    render();
  });
  on('click', (e) => {
    const c = e.target.closest('.h'); if (!c) return;
    sel = `${c.dataset.dia}|${c.dataset.i}`;
    const w = ventana(v, c.dataset.dia, +c.dataset.i, 1);
    document.querySelectorAll('.h.sel').forEach((x) => x.classList.remove('sel'));
    c.classList.add('sel');
    $('#detalle').innerHTML = `<b>${esc(rango({ ...v, duracion: PASO }, w))}</b><br>
      Pueden: ${w.si.map(esc).join(', ') || '—'}${w.quiza.length ? `<br>Si es necesario: ${w.quiza.map(esc).join(', ')}` : ''}<br>No: ${w.no.map(esc).join(', ') || '—'}`;
  });
  on('submit', (e) => {
    if (e.target.id !== 'fn') return;
    e.preventDefault();
    yo = e.target.n.value.trim(); if (!yo) return;
    local.set('nombre', yo); cargarMio(); render();
  });

  // Pintar arrastrando (mouse y táctil): se pinta el rectángulo entre la celda inicial y la actual.
  let origen;
  const pintar = (c) => {
    const col = (x) => v.dias.findIndex((d) => d.id === x.dataset.dia);
    const [d0, d1] = [col(origen.c), col(c)].sort((a, b) => a - b), [i0, i1] = [+origen.c.dataset.i, +c.dataset.i].sort((a, b) => a - b);
    mio = { ...origen.mio };
    document.querySelectorAll('.grid.votar .c').forEach((x) => {
      const dentro = col(x) >= d0 && col(x) <= d1 && x.dataset.i >= i0 && x.dataset.i <= i1;
      if (dentro) poner(x.dataset.dia, +x.dataset.i, pintando);
      x.dataset.v = (mio[x.dataset.dia] || '')[x.dataset.i] || '0';
    });
  };
  on('pointerdown', (e) => {
    const c = e.target.closest('.c'); if (!c || v.cerrada) return;
    e.preventDefault();
    pintando = c.dataset.v === pincel ? '0' : pincel;
    origen = { c, mio: { ...mio } };
    pintar(c);
  });
  on('pointermove', (e) => {
    if (!pintando) return;
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest('.c');
    if (c) pintar(c);
  });
  const fin = () => { if (!pintando) return; pintando = false; guardar(); };
  addEventListener('pointerup', fin, { signal: ac.signal });
  addEventListener('pointercancel', fin, { signal: ac.signal });

  const unsub = db.ver(id, (nueva) => {
    v = nueva;
    if (v && yo && mio === null) cargarMio();
    if (!pintando) render();
  });
  return () => { unsub(); ac.abort(); };
}

// ---------- Rutas: #/  ·  #/nueva  ·  #/v/<id> ----------

let salir = () => {};
function ruta() {
  salir();
  const [, r, id] = location.hash.split('/');
  salir = r === 'v' && id ? votacion(id) : r === 'nueva' && esAdmin() ? nueva() : inicio();
}
addEventListener('hashchange', ruta);
ruta();
