export function errorHandler(err, req, res, next) {
  console.error('💥 Error en API:', err);
  const status = err.status || (err.code === '40P01' || err.code === '40001' ? 503 : 500);
  const message =
    err.code === '40P01' || err.code === '40001'
      ? 'El servidor estaba sincronizando peticiones simultáneas. Por favor intenta de nuevo.'
      : err.message || 'Error interno del servidor';
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
