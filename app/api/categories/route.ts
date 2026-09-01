import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isCategoryType } from '@/lib/catalog';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tblCategorias ORDER BY Categoria ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ message: 'No se pudieron consultar las categorías' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { Categoria, TipoCategoria } = await request.json();
    if (!String(Categoria || '').trim() || !isCategoryType(TipoCategoria)) {
      return NextResponse.json({ message: 'Nombre y tipo de categoría son requeridos' }, { status: 400 });
    }

    const [maxId] = await pool.query('SELECT MAX(IdCategoria) as maxId FROM tblCategorias');
    const id = ((maxId as any[])[0].maxId || 0) + 1;

    await pool.query(
      'INSERT INTO tblCategorias (IdCategoria, Categoria, EsExtra, TipoCategoria) VALUES (?, ?, ?, ?)',
      [id, String(Categoria).trim(), TipoCategoria === 'EXTRA' ? 1 : 0, TipoCategoria]
    );
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ message: 'No se pudo crear la categoría' }, { status: 500 });
  }
}
