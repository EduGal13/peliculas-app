# 🎬 Mi cartelera: control de películas

Aplicación con **Node.js + Express + JWT + PostgreSQL** y un frontend en **HTML, CSS y JS**.
Cada usuario se registra, inicia sesión y administra **sus propias** películas (crear, ver, editar, eliminar, buscar y filtrar).

## Estructura

```
peliculas-app/
├── server.js              ← arranque del servidor
├── schema.sql             ← tablas (usuarios y peliculas)
├── src/
│   ├── db.js              ← conexión a PostgreSQL
│   ├── middleware/auth.js ← verificación del token JWT
│   └── routes/
│       ├── auth.js        ← /api/auth/registro y /api/auth/login
│       └── peliculas.js   ← /api/peliculas (protegido con JWT)
├── public/                ← frontend (index.html, styles.css, app.js)
├── .env.example           ← plantilla de variables de entorno
└── render.yaml            ← configuración opcional para Render
```

---

## 1. Probar en tu computadora (Visual Studio Code)

**Requisitos:** Node.js 18+, PostgreSQL instalado y DBeaver.

1. Abre la carpeta en VS Code (`Archivo → Abrir carpeta`) y abre la terminal (`Ctrl + ñ`).
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea la base de datos en **DBeaver**:
   - Conéctate a tu PostgreSQL local (`Database → New Database Connection → PostgreSQL`, usuario `postgres`).
   - Clic derecho en *Databases* → **Create New Database** → nombre: `peliculas_db`.
4. Copia `.env.example` a `.env` y ajusta tu contraseña:
   ```
   DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/peliculas_db
   JWT_SECRET=una_frase_larga_y_secreta
   ```
5. Inicia la app:
   ```bash
   npm run dev
   ```
6. Abre **http://localhost:3000**, crea una cuenta y agrega películas.

> Las tablas se crean solas al iniciar. Si prefieres hacerlo a mano, abre `schema.sql` en DBeaver y ejecútalo con `Alt + X`.

---

## 2. Subir a GitHub

```bash
git init
git add .
git commit -m "Primera versión: control de películas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/peliculas-app.git
git push -u origin main
```

Primero crea el repositorio vacío en github.com (botón **New**, sin README).
El archivo `.env` está en `.gitignore`, así que tus contraseñas **no se suben**.

Para actualizar después de cualquier cambio:

```bash
git add .
git commit -m "Describe aquí lo que cambiaste"
git push
```

---

## 3. Publicar en Render

### a) Base de datos PostgreSQL
1. En [render.com](https://render.com): **New → PostgreSQL**. Nombre: `peliculas-db`, plan Free.
2. Cuando esté lista, copia la **Internal Database URL** (para la app) y la **External Database URL** (para DBeaver).

### b) Servicio web
1. **New → Web Service** → conecta tu cuenta de GitHub y elige el repositorio.
2. Configura:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. En **Environment** agrega:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la *Internal Database URL* de Render |
   | `JWT_SECRET` | una frase larga y aleatoria |
   | `JWT_EXPIRES_IN` | `8h` |
   | `DB_SSL` | `true` |

4. **Create Web Service**. Al terminar, Render te da una URL pública `https://tu-app.onrender.com`.

Desde ahora, **cada `git push` a `main` actualiza la app automáticamente** en Render.

> En el plan gratuito, Render apaga la app tras un rato sin visitas; la primera carga puede tardar ~50 segundos.

---

## 4. Ver la base de datos de Render con DBeaver

1. `New Database Connection → PostgreSQL`.
2. Con la **External Database URL** de Render llena: Host, Port, Database, Username y Password.
3. En la pestaña **SSL** activa *Use SSL* (modo `require`).
4. Prueba la conexión y abre `Schemas → public → Tables`: ahí verás `usuarios` y `peliculas`.

Consulta útil:
```sql
SELECT p.titulo, p.calificacion, p.estado, u.nombre
FROM peliculas p JOIN usuarios u ON u.id = p.usuario_id
ORDER BY p.creado_en DESC;
```

---

## API

| Método | Ruta | ¿Requiere JWT? | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | No | Crea usuario y devuelve token |
| POST | `/api/auth/login` | No | Inicia sesión y devuelve token |
| GET | `/api/peliculas?q=&estado=` | Sí | Lista (búsqueda y filtro opcionales) |
| POST | `/api/peliculas` | Sí | Crea película |
| PUT | `/api/peliculas/:id` | Sí | Edita película |
| DELETE | `/api/peliculas/:id` | Sí | Elimina película |

El token se envía en el header `Authorization: Bearer <token>`.
