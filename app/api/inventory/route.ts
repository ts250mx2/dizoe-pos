import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

interface InventoryProductRow extends RowDataPacket {
  IdProducto: number;
  Producto: string;
  StockActual: number;
  StockMinimo: number;
  UnidadMedida: string;
}

const MOVEMENT_TYPES = ['ENTRADA', 'SALIDA', 'AJUSTE'] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

export async function GET() {
  try {
    const [products] = await pool.query(`
      SELECT p.IdProducto, p.Producto, p.Precio1, p.StockActual, p.StockMinimo,
             p.UnidadMedida, p.ArchivoImagen, c.IdCategoria, c.Categoria
      FROM tblProductos p
      INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
      WHERE p.Status = 1 AND c.TipoCategoria = 'PRODUCTO'
      ORDER BY (p.StockActual <= p.StockMinimo) DESC, p.Producto ASC
    `);

    const [movements] = await pool.query(`
      SELECT m.IdMovimientoInventario, m.IdProducto, p.Producto, m.TipoMovimiento,
             m.Cantidad, m.StockAnterior, m.StockNuevo, m.Motivo, m.IdVenta,
             m.FechaMovimiento, p.UnidadMedida
      FROM tblMovimientosInventario m
      INNER JOIN tblProductos p ON p.IdProducto = m.IdProducto
      ORDER BY m.FechaMovimiento DESC, m.IdMovimientoInventario DESC
      LIMIT 100
    `);

    const productRows = products as InventoryProductRow[];
    return NextResponse.json({
      products,
      movements,
      summary: {
        products: productRows.length,
        lowStock: productRows.filter((product) => Number(product.StockActual) <= Number(product.StockMinimo)).length,
        outOfStock: productRows.filter((product) => Number(product.StockActual) <= 0).length,
      },
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ message: 'No se pudo consultar el inventario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const type = body.tipo as MovementType;
    const productId = Number(body.idProducto);
    const amount = Number(body.cantidad);
    const reason = String(body.motivo || '').trim();

    const invalidAmount = !Number.isFinite(amount) || amount < 0 || (type !== 'AJUSTE' && amount <= 0);
    if (!MOVEMENT_TYPES.includes(type) || !Number.isInteger(productId) || invalidAmount || !reason) {
      return NextResponse.json({ message: 'Completa tipo, cantidad y motivo del movimiento' }, { status: 400 });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query<InventoryProductRow[]>(`
      SELECT p.IdProducto, p.Producto, p.StockActual, p.StockMinimo, p.UnidadMedida
      FROM tblProductos p
      INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
      WHERE p.IdProducto = ? AND p.Status = 1 AND c.TipoCategoria = 'PRODUCTO'
      FOR UPDATE
    `, [productId]);

    const product = rows[0];
    if (!product) {
      await connection.rollback();
      return NextResponse.json({ message: 'El artículo no pertenece a una categoría de producto' }, { status: 400 });
    }

    const previous = Number(product.StockActual);
    let next = previous;
    let signedAmount = amount;

    if (type === 'ENTRADA') next = previous + amount;
    if (type === 'SALIDA') {
      next = previous - amount;
      signedAmount = -amount;
    }
    if (type === 'AJUSTE') {
      next = amount;
      signedAmount = next - previous;
    }

    if (next < 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: `Existencia insuficiente. Disponible: ${previous} ${product.UnidadMedida}.` },
        { status: 400 }
      );
    }

    await connection.query('UPDATE tblProductos SET StockActual = ? WHERE IdProducto = ?', [next, productId]);
    await connection.query(
      `INSERT INTO tblMovimientosInventario
       (IdProducto, TipoMovimiento, Cantidad, StockAnterior, StockNuevo, Motivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, type, signedAmount, previous, next, reason]
    );
    await connection.commit();
    return NextResponse.json({ success: true, stockActual: next });
  } catch (error) {
    await connection.rollback();
    console.error('Inventory POST error:', error);
    return NextResponse.json({ message: 'No se pudo registrar el movimiento' }, { status: 500 });
  } finally {
    connection.release();
  }
}
