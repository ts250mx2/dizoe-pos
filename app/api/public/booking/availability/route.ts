import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAvailability } from '@/lib/booking';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('fecha') || '';
    const productId = Number(searchParams.get('servicio'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(productId)) {
      return NextResponse.json({ message: 'Fecha y servicio son requeridos' }, { status: 400 });
    }
    const [result] = await pool.query(`
      SELECT p.DuracionMinutos FROM tblProductos p
      INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
      WHERE p.IdProducto = ? AND p.Status = 1 AND c.TipoCategoria = 'SERVICIO'
    `, [productId]);
    const rows = result as { DuracionMinutos: number }[];
    if (!rows[0]) return NextResponse.json({ message: 'Servicio no disponible' }, { status: 404 });
    const duration = Number(rows[0].DuracionMinutos || 60);
    return NextResponse.json({ date, duration, slots: await getAvailability(pool, date, duration) });
  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json({ message: 'No se pudo consultar la disponibilidad' }, { status: 500 });
  }
}
