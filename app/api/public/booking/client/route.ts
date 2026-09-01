import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizePhone, PHONE_NORMALIZED_SQL } from '@/lib/phone';

export async function GET(request: Request) {
  try {
    const phone = normalizePhone(new URL(request.url).searchParams.get('telefono'));
    if (phone.length < 7) {
      return NextResponse.json({ found: false }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const legacyPhone = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;

    const [result] = await pool.query(
      `SELECT NombreCliente, CorreoElectronico
       FROM tblClientes
       WHERE (${PHONE_NORMALIZED_SQL} = ? OR ${PHONE_NORMALIZED_SQL} = ?)
         AND Status = 1
       ORDER BY IdCliente DESC LIMIT 1`,
      [phone, legacyPhone]
    );
    const client = (result as { NombreCliente: string; CorreoElectronico: string | null }[])[0];
    return NextResponse.json(
      client
        ? { found: true, nombre: client.NombreCliente, correo: client.CorreoElectronico || '' }
        : { found: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Public client lookup error:', error);
    return NextResponse.json({ message: 'No se pudo buscar el teléfono' }, { status: 500 });
  }
}
