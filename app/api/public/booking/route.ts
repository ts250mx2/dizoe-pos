import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAgendaConfig } from '@/lib/booking';

export async function GET() {
  try {
    const config = await getAgendaConfig(pool);
    const [services] = await pool.query(`
      SELECT p.IdProducto, p.Producto, p.Precio1, p.DuracionMinutos, c.Categoria
      FROM tblProductos p INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
      WHERE p.Status = 1 AND c.TipoCategoria = 'SERVICIO'
      ORDER BY c.Categoria, p.Producto
    `);
    return NextResponse.json({ config, services });
  } catch (error) {
    console.error('Public booking config error:', error);
    return NextResponse.json({ message: 'No se pudo cargar la agenda' }, { status: 500 });
  }
}
