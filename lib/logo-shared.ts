// Reglas del logo compartidas entre cliente (validación al arrastrar)
// y servidor (validación y guardado). Sin dependencias de Node para que
// pueda importarse desde componentes 'use client'.

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export const LOGO_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export const LOGO_MIME_TYPES = Object.keys(LOGO_EXTENSIONS);

export const LOGO_RULES_MESSAGE = 'Usa una imagen PNG, JPG, WEBP o SVG';
export const LOGO_SIZE_MESSAGE = 'El logo no debe pesar más de 2 MB';
