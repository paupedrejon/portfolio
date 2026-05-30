-- Reiniciar progreso del curso React (ejecutar manualmente en SQL Editor si hace falta)
-- No borra perfiles ni tokens de descarga.

DELETE FROM level_progress WHERE course_slug = 'react';
DELETE FROM diplomas WHERE course_slug = 'react';
