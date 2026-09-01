import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { LOGO_EXTENSIONS } from '@/lib/logo-shared';

// Utilidades de logo SOLO para servidor (usan fs); la validación
// compartida con el cliente vive en lib/logo-shared.ts.

/** Extrae extensión y bytes de un data URL de imagen soportada; null si no es válido. */
export function parseLogoDataUrl(dataUrl: string): { extension: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([a-z0-9.+/-]+);base64,(.+)$/i);
  if (!match) return null;

  const extension = LOGO_EXTENSIONS[match[1].toLowerCase()];
  if (!extension) return null;

  try {
    return { extension, buffer: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

/**
 * Guarda el logo en public/uploads/logos y devuelve su ruta pública.
 * Se sirve vía /api/logos/[file] (no como estático) porque next start
 * no sirve archivos agregados a public/ después del arranque.
 */
export async function saveLogo(dataUrl: string): Promise<string> {
  const parsed = parseLogoDataUrl(dataUrl);
  if (!parsed) throw new Error('Logo inválido');

  const fileName = `${crypto.randomUUID()}.${parsed.extension}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos');

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, fileName), parsed.buffer);

  return `/api/logos/${fileName}`;
}
