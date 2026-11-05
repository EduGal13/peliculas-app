const jwt = require('jsonwebtoken');

// Verifica el token JWT enviado en el header: Authorization: Bearer <token>
module.exports = function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Falta el token. Inicia sesión.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o vencido. Inicia sesión de nuevo.' });
  }
};
