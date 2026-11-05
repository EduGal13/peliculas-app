// ================== Utilidades ==================
const $ = (sel) => document.querySelector(sel);
const API = '/api';

const guardar = {
  token: () => localStorage.getItem('token'),
  usuario: () => JSON.parse(localStorage.getItem('usuario') || 'null'),
  set: (token, usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  },
  borrar: () => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); },
};

async function api(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (guardar.token()) headers.Authorization = `Bearer ${guardar.token()}`;

  const res = await fetch(API + ruta, { ...opciones, headers });
  const datos = await res.json().catch(() => ({}));

  if (res.status === 401 && guardar.token()) {
    cerrarSesion();
    throw new Error('Tu sesión venció. Inicia sesión de nuevo.');
  }
  if (!res.ok) throw new Error(datos.error || 'Ocurrió un error.');
  return datos;
}

function esc(texto) {
  const d = document.createElement('div');
  d.textContent = texto ?? '';
  return d.innerHTML;
}

// ================== Acceso ==================
function mostrarPestana(login) {
  $('#form-login').hidden = !login;
  $('#form-registro').hidden = login;
  $('#tab-login').setAttribute('aria-selected', login);
  $('#tab-registro').setAttribute('aria-selected', !login);
  $('#msg-acceso').textContent = '';
}
$('#tab-login').onclick = () => mostrarPestana(true);
$('#tab-registro').onclick = () => mostrarPestana(false);

async function enviarAcceso(e, ruta) {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  try {
    const r = await api(ruta, { method: 'POST', body: JSON.stringify(datos) });
    guardar.set(r.token, r.usuario);
    e.target.reset();
    entrarApp();
  } catch (err) {
    $('#msg-acceso').textContent = err.message;
  }
}
$('#form-login').onsubmit = (e) => enviarAcceso(e, '/auth/login');
$('#form-registro').onsubmit = (e) => enviarAcceso(e, '/auth/registro');

function cerrarSesion() {
  guardar.borrar();
  $('#vista-app').hidden = true;
  $('#vista-acceso').hidden = false;
}
$('#btn-salir').onclick = cerrarSesion;

function entrarApp() {
  $('#vista-acceso').hidden = true;
  $('#vista-app').hidden = false;
  $('#nombre-usuario').textContent = guardar.usuario()?.nombre || '';
  cargarPeliculas();
}

// ================== Películas ==================
let peliculas = [];

async function cargarPeliculas() {
  const params = new URLSearchParams();
  if ($('#buscar').value.trim()) params.set('q', $('#buscar').value.trim());
  if ($('#filtro-estado').value) params.set('estado', $('#filtro-estado').value);

  try {
    peliculas = await api('/peliculas?' + params);
    $('#msg-app').textContent = '';
    pintar();
  } catch (err) {
    $('#msg-app').textContent = err.message;
  }
}

function pintar() {
  const lista = $('#lista');
  lista.innerHTML = peliculas.map((p) => {
    const nota = p.calificacion !== null ? Number(p.calificacion).toFixed(1) : '–';
    const datos = [p.director, p.anio, p.genero, p.duracion_min ? `${p.duracion_min} min` : null]
      .filter(Boolean).map(esc).join(' · ');
    return `
      <li class="boleto">
        <div class="boleto-talon">
          <span class="nota ${p.calificacion === null ? 'sin' : ''}">${nota}</span>
          <span class="estado ${p.estado}">${p.estado === 'vista' ? 'Vista' : 'Por ver'}</span>
        </div>
        <div class="boleto-cuerpo">
          <h2>${esc(p.titulo)}</h2>
          ${datos ? `<p class="datos">${datos}</p>` : ''}
          ${p.sinopsis ? `<p class="sinopsis">${esc(p.sinopsis)}</p>` : ''}
        </div>
        <div class="boleto-acciones">
          <button class="btn btn-texto" data-editar="${p.id}">Editar</button>
          <button class="btn btn-texto btn-peligro" data-borrar="${p.id}">Eliminar</button>
        </div>
      </li>`;
  }).join('');

  $('#vacio').hidden = peliculas.length > 0;
  resumen();
}

async function resumen() {
  // El resumen usa todas las películas, sin filtros
  try {
    const todas = await api('/peliculas');
    const vistas = todas.filter((p) => p.estado === 'vista').length;
    const notas = todas.filter((p) => p.calificacion !== null).map((p) => Number(p.calificacion));
    $('#r-total').textContent = todas.length;
    $('#r-vistas').textContent = vistas;
    $('#r-pendientes').textContent = todas.length - vistas;
    $('#r-promedio').textContent = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '–';
  } catch { /* se ignora: ya se muestra el error en la lista */ }
}

// Buscar y filtrar
let temporizador;
$('#buscar').oninput = () => { clearTimeout(temporizador); temporizador = setTimeout(cargarPeliculas, 300); };
$('#filtro-estado').onchange = cargarPeliculas;

// Acciones en la lista
$('#lista').onclick = async (e) => {
  const editar = e.target.dataset.editar;
  const borrar = e.target.dataset.borrar;

  if (editar) abrirDialogo(peliculas.find((p) => p.id == editar));

  if (borrar) {
    const p = peliculas.find((x) => x.id == borrar);
    if (!confirm(`¿Eliminar "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`/peliculas/${borrar}`, { method: 'DELETE' });
      cargarPeliculas();
    } catch (err) {
      $('#msg-app').textContent = err.message;
    }
  }
};

// ================== Diálogo agregar / editar ==================
const dialogo = $('#dialogo');
const formP = $('#form-pelicula');

function abrirDialogo(pelicula) {
  formP.reset();
  $('#msg-dialogo').textContent = '';
  $('#dialogo-titulo').textContent = pelicula ? 'Editar película' : 'Agregar película';
  formP.id.value = pelicula?.id || '';
  if (pelicula) {
    for (const campo of ['titulo', 'director', 'genero', 'anio', 'duracion_min', 'calificacion', 'estado', 'sinopsis']) {
      formP.elements[campo].value = pelicula[campo] ?? '';
    }
  }
  dialogo.showModal();
}

$('#btn-nueva').onclick = () => abrirDialogo(null);
$('#btn-cancelar').onclick = () => dialogo.close();

formP.onsubmit = async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formP));
  const id = datos.id;
  delete datos.id;

  try {
    await api(id ? `/peliculas/${id}` : '/peliculas', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(datos),
    });
    dialogo.close();
    cargarPeliculas();
  } catch (err) {
    $('#msg-dialogo').textContent = err.message;
  }
};

// ================== Inicio ==================
if (guardar.token()) entrarApp();
