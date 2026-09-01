import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.Categoria, c.EsExtra, c.TipoCategoria
      FROM tblProductos p
      LEFT JOIN tblCategorias c ON p.IdCategoria = c.IdCategoria
      WHERE p.Status = 1
      ORDER BY p.Producto ASC
    `);
    const [categories] = await pool.query('SELECT * FROM tblCategorias ORDER BY Categoria ASC');
    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ message: 'No se pudo cargar el catálogo' }, { status: 500 });
  }
}
