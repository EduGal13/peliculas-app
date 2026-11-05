require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./src/db');

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Faltan variables de entorno: revisa DATABASE_URL y JWT_SECRET (archivo .env).');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Frontend (HTML + CSS + JS)
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/peliculas', require('./src/routes/peliculas'));
app.get('/api/salud', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  });
