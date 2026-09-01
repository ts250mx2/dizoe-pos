import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const [sales] = await pool.query('SELECT * FROM tblVentas WHERE IdVenta = ?', [id]);
    const venta = (sales as any[])[0];

    if (!venta) {
      return NextResponse.json({ message: 'No encontrada' }, { status: 404 });
    }

    const [details] = await pool.query(
      'SELECT d.*, p.Producto FROM tblDetalleVentas d JOIN tblProductos p ON d.IdProducto = p.IdProducto WHERE d.IdVenta = ?',
      [id]
    );

    return NextResponse.json({ venta, details });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
