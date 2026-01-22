/**
 * Normaliza la URL de FastAPI para evitar problemas con barras dobles
 * @param url URL base de FastAPI (puede tener o no barra final)
 * @param path Ruta a concatenar (debe empezar con /)
 * @returns URL completa normalizada
 */
export function getFastAPIUrl(path: string): string {
  const baseUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  // Eliminar barra final si existe
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  // Asegurar que el path empiece con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

