const express = require('express');
const { pool } = require('../db');
const verificarToken = require('../middleware/auth');

const router = express.Router();
router.use(verificarToken); // todas las rutas de películas requieren JWT

// Valida y limpia los datos de una película
function limpiar(body) {
  const errores = [];
  const titulo = (body.titulo || '').trim();
  if (!titulo) errores.push('El título es obligatorio.');

  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const anio = num(body.anio);
  const duracion = num(body.duracion_min);
  const calificacion = num(body.calificacion);

  if (anio !== null && (!Number.isInteger(anio) || anio < 1888 || anio > 2100)) errores.push('Año inválido.');
  if (duracion !== null && (!Number.isInteger(duracion) || duracion <= 0)) errores.push('Duración inválida.');
  if (calificacion !== null && (isNaN(calificacion) || calificacion < 0 || calificacion > 10)) errores.push('La calificación debe estar entre 0 y 10.');

  const estado = body.estado || 'pendiente';
  if (!['pendiente', 'vista'].includes(estado)) errores.push('Estado inválido.');

  return {
    errores,
    datos: {
      titulo,
      director: (body.director || '').trim() || null,
      anio,
      genero: (body.genero || '').trim() || null,
      duracion_min: duracion,
      calificacion,
      estado,
      sinopsis: (body.sinopsis || '').trim() || null,
    },
  };
}

// GET /api/peliculas?estado=vista&q=matrix
router.get('/', async (req, res) => {
  try {
    const params = [req.usuario.id];
    let sql = 'SELECT * FROM peliculas WHERE usuario_id = $1';

    if (req.query.estado) {
      params.push(req.query.estado);
      sql += ` AND estado = $${params.length}`;
    }
    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      sql += ` AND (titulo ILIKE $${params.length} OR director ILIKE $${params.length} OR genero ILIKE $${params.length})`;
    }
    sql += ' ORDER BY creado_en DESC';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las películas.' });
  }
});

// POST /api/peliculas
router.post('/', async (req, res) => {
  const { errores, datos } = limpiar(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `INSERT INTO peliculas (usuario_id, titulo, director, anio, genero, duracion_min, calificacion, estado, sinopsis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.usuario.id, datos.titulo, datos.director, datos.anio, datos.genero, datos.duracion_min, datos.calificacion, datos.estado, datos.sinopsis]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la película.' });
  }
});

// PUT /api/peliculas/:id
router.put('/:id', async (req, res) => {
  const { errores, datos } = limpiar(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join(' ') });

  try {
    const { rows } = await pool.query(
      `UPDATE peliculas
          SET titulo=$1, director=$2, anio=$3, genero=$4, duracion_min=$5,
              calificacion=$6, estado=$7, sinopsis=$8, actualizado_en=NOW()
        WHERE id=$9 AND usuario_id=$10 RETURNING *`,
      [datos.titulo, datos.director, datos.anio, datos.genero, datos.duracion_min, datos.calificacion, datos.estado, datos.sinopsis, req.params.id, req.usuario.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Película no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la película.' });
  }
});

// DELETE /api/peliculas/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM peliculas WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Película no encontrada.' });
    res.json({ mensaje: 'Película eliminada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la película.' });
  }
});

module.exports = router;
