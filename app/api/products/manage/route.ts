import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.Categoria, c.EsExtra, c.TipoCategoria
      FROM tblProductos p
      LEFT JOIN tblCategorias c ON p.IdCategoria = c.IdCategoria
      ORDER BY p.Producto ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Products manage GET error:', error);
    return NextResponse.json({ message: 'No se pudo cargar el catálogo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const [maxId] = await pool.query('SELECT MAX(IdProducto) as maxId FROM tblProductos');
    const id = ((maxId as any[])[0].maxId || 0) + 1;

    await pool.query(
      `INSERT INTO tblProductos
       (IdProducto, Producto, Precio1, Precio2, Precio3, IdCategoria, Status,
        Multiple, ArchivoImagen, DuracionMinutos, StockActual, StockMinimo, UnidadMedida)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        String(data.Producto || '').trim(),
        Number(data.Precio1) || 0,
        Number(data.Precio2) || 0,
        Number(data.Precio3) || 0,
        Number(data.IdCategoria),
        Number(data.Multiple) || 0,
        data.ArchivoImagen || null,
        Math.max(5, Number(data.DuracionMinutos) || 60),
        Math.max(0, Math.round(Number(data.StockMinimo)) || 0),
        String(data.UnidadMedida || 'pieza').trim() || 'pieza',
      ]
    );
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Products manage POST error:', error);
    return NextResponse.json({ message: 'No se pudo crear el artículo' }, { status: 500 });
  }
}
