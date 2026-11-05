-- Puedes ejecutar este script en DBeaver (la app también lo ejecuta sola al iniciar)

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peliculas (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  director      VARCHAR(150),
  anio          SMALLINT CHECK (anio BETWEEN 1888 AND 2100),
  genero        VARCHAR(60),
  duracion_min  SMALLINT CHECK (duracion_min > 0),
  calificacion  NUMERIC(3,1) CHECK (calificacion BETWEEN 0 AND 10),
  estado        VARCHAR(12)  NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','vista')),
  sinopsis      TEXT,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peliculas_usuario ON peliculas(usuario_id);
