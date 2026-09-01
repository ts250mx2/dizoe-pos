import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { LOGO_EXTENSIONS } from '@/lib/logo-shared';

// Sólo nombres generados por saveLogo: uuid.ext (evita path traversal).
const FILE_NAME_REGEX = /^[a-f0-9-]+\.(png|jpg|webp|svg)$/i;

const MIME_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(LOGO_EXTENSIONS).map(([mime, ext]) => [ext, mime])
);

/**
 * Sirve los logos subidos en runtime. next start fija los archivos de
 * public/ al arrancar, así que un logo recién subido daría 404 si se
 * sirviera como estático; este handler lo lee del disco en cada request.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!FILE_NAME_REGEX.test(file)) {
    return NextResponse.json({ message: 'Archivo inválido' }, { status: 400 });
  }

  const extension = file.split('.').pop()!.toLowerCase();
  const filePath = path.join(process.cwd(), 'public', 'uploads', 'logos', file);

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': MIME_BY_EXTENSION[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Logo no encontrado' }, { status: 404 });
  }
}
