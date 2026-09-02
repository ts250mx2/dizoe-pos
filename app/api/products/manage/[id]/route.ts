import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await pool.query(
      `UPDATE tblProductos
       SET Producto = ?, Precio1 = ?, Precio2 = ?, Precio3 = ?, IdCategoria = ?,
           Status = ?, Multiple = ?, ArchivoImagen = ?, DuracionMinutos = ?, StockMinimo = ?, UnidadMedida = ?
       WHERE IdProducto = ?`,
      [
        String(data.Producto || '').trim(),
        Number(data.Precio1) || 0,
        Number(data.Precio2) || 0,
        Number(data.Precio3) || 0,
        Number(data.IdCategoria),
        Number(data.Status ?? 1),
        Number(data.Multiple) || 0,
        data.ArchivoImagen || null,
        Math.max(5, Number(data.DuracionMinutos) || 60),
        Math.max(0, Math.round(Number(data.StockMinimo)) || 0),
        String(data.UnidadMedida || 'pieza').trim() || 'pieza',
        id,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products manage PUT error:', error);
    return NextResponse.json({ message: 'No se pudo actualizar el artículo' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [sales] = await pool.query('SELECT IdDetalleVenta FROM tblDetalleVentas WHERE IdProducto = ? LIMIT 1', [id]);
    const [movements] = await pool.query('SELECT IdMovimientoInventario FROM tblMovimientosInventario WHERE IdProducto = ? LIMIT 1', [id]);
    if ((sales as any[]).length > 0 || (movements as any[]).length > 0) {
      await pool.query('UPDATE tblProductos SET Status = 0 WHERE IdProducto = ?', [id]);
    } else {
      await pool.query('DELETE FROM tblProductos WHERE IdProducto = ?', [id]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products manage DELETE error:', error);
    return NextResponse.json({ message: 'No se pudo eliminar el artículo' }, { status: 500 });
  }
}
