import { NextResponse } from 'next/server';
import { parseLogoDataUrl, saveLogo } from '@/lib/logo';
import { MAX_LOGO_BYTES, LOGO_RULES_MESSAGE, LOGO_SIZE_MESSAGE } from '@/lib/logo-shared';

/**
 * Sube un logo (data URL base64) a public/uploads/logos y devuelve su ruta
 * pública para guardarla en tblConfigTicket.LogoPath.
 */
export async function POST(request: Request) {
  try {
    const { logoBase64 } = await request.json();

    if (!logoBase64 || typeof logoBase64 !== 'string') {
      return NextResponse.json({ success: false, message: 'No se recibió ninguna imagen' }, { status: 400 });
    }

    const parsed = parseLogoDataUrl(logoBase64);
    if (!parsed) {
      return NextResponse.json({ success: false, message: LOGO_RULES_MESSAGE }, { status: 400 });
    }
    if (parsed.buffer.length > MAX_LOGO_BYTES) {
      return NextResponse.json({ success: false, message: LOGO_SIZE_MESSAGE }, { status: 400 });
    }

    const path = await saveLogo(logoBase64);
    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error('Upload logo error:', error);
    return NextResponse.json({ success: false, message: 'Error al subir el logo' }, { status: 500 });
  }
}
