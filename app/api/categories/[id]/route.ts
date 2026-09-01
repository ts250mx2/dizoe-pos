import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isCategoryType } from '@/lib/catalog';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { Categoria, TipoCategoria } = await request.json();
    if (!String(Categoria || '').trim() || !isCategoryType(TipoCategoria)) {
      return NextResponse.json({ message: 'Nombre y tipo de categoría son requeridos' }, { status: 400 });
    }

    await pool.query(
      'UPDATE tblCategorias SET Categoria = ?, EsExtra = ?, TipoCategoria = ? WHERE IdCategoria = ?',
      [String(Categoria).trim(), TipoCategoria === 'EXTRA' ? 1 : 0, TipoCategoria, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories PUT error:', error);
    return NextResponse.json({ message: 'No se pudo actualizar la categoría' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [products] = await pool.query('SELECT IdProducto FROM tblProductos WHERE IdCategoria = ?', [id]);
    if ((products as any[]).length > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar una categoría con artículos asociados' },
        { status: 400 }
      );
    }
    await pool.query('DELETE FROM tblCategorias WHERE IdCategoria = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ message: 'No se pudo eliminar la categoría' }, { status: 500 });
  }
}
