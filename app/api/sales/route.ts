import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

class SaleValidationError extends Error {}

interface SaleProductRow extends RowDataPacket {
  IdProducto: number;
  Producto: string;
  StockActual: number;
  UnidadMedida: string;
  TipoCategoria: string;
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const { cart, total, idApertura, efectivo, tarjeta, transferencia, cliente, idCliente } = await request.json();
    const paid = (Number(efectivo) || 0) + (Number(tarjeta) || 0) + (Number(transferencia) || 0);
    if (paid < Number(total) - 0.01) {
      return NextResponse.json({ message: 'El monto pagado no cubre el total.' }, { status: 400 });
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ message: 'La venta no contiene artículos.' }, { status: 400 });
    }

    await connection.beginTransaction();
    const [sessionRows] = await connection.query<RowDataPacket[]>(
      'SELECT IdApertura FROM tblAperturasCierres WHERE (IdSupervisorCierre = 0 OR IdSupervisorCierre IS NULL) AND IdApertura = ? FOR UPDATE',
      [idApertura]
    );
    if (sessionRows.length === 0) throw new SaleValidationError('No hay caja abierta. Abre la caja antes de vender.');

    // Agrupa el mismo producto aunque aparezca varias veces en el carrito.
    const quantities = new Map<number, number>();
    for (const item of cart) {
      const id = Number(item.productId);
      quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity || 0));
    }

    const inventoryUpdates: Array<{ product: SaleProductRow; quantity: number; nextStock: number }> = [];
    for (const [productId, quantity] of quantities) {
      const [rows] = await connection.query<SaleProductRow[]>(`
        SELECT p.IdProducto, p.Producto, p.StockActual, p.UnidadMedida, c.TipoCategoria
        FROM tblProductos p
        INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
        WHERE p.IdProducto = ? AND p.Status = 1
        FOR UPDATE
      `, [productId]);
      const product = rows[0];
      if (!product) throw new SaleValidationError('Uno de los artículos ya no está disponible.');

      if (product.TipoCategoria === 'PRODUCTO') {
        const currentStock = Number(product.StockActual);
        if (quantity <= 0 || currentStock < quantity) {
          throw new SaleValidationError(
            `Existencia insuficiente de ${product.Producto}. Disponible: ${currentStock} ${product.UnidadMedida}.`
          );
        }
        inventoryUpdates.push({ product, quantity, nextStock: currentStock - quantity });
      }
    }

    const [maxVenta] = await connection.query<RowDataPacket[]>('SELECT MAX(IdVenta) as maxId FROM tblVentas FOR UPDATE');
    const idVenta = Number(maxVenta[0].maxId || 0) + 1;
    const [maxFolio] = await connection.query<RowDataPacket[]>(
      'SELECT MAX(CAST(Folio AS UNSIGNED)) as maxFolio FROM tblVentas WHERE IdApertura = ? FOR UPDATE',
      [idApertura]
    );
    const folio = Number(maxFolio[0].maxFolio || 0) + 1;
    const folioStr = String(folio).padStart(6, '0');

    await connection.query(`
      INSERT INTO tblVentas
        (IdVenta, IdApertura, IdComputadora, Folio, Total, FechaVenta,
         IdAperturaPago, Efectivo, Tarjeta, Transferencia, Cancelada, VentaEn, Cliente, IdCliente)
      VALUES (?, ?, 1, ?, ?, NOW(), ?, ?, ?, ?, 0, 1, ?, ?)
    `, [idVenta, idApertura, folioStr, total, idApertura,
      efectivo || 0, tarjeta || 0, transferencia || 0, cliente || '', idCliente || null]);

    for (const item of cart) {
      const [mainResult] = await connection.query(`
        INSERT INTO tblDetalleVentas
          (IdVenta, IdProducto, Cantidad, Precio, Fecha, Folio, IdApertura, TipoPrecio, Descuento, EsExtra)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 0, ?)
      `, [idVenta, item.productId, item.quantity, item.price, folio, idApertura, item.typePrice, item.isExtra || 0]);
      const parentId = (mainResult as any).insertId;

      for (const extra of item.extras || []) {
        await connection.query(`
          INSERT INTO tblDetalleVentas
            (IdVenta, IdProducto, Cantidad, Precio, Fecha, Folio, IdApertura, TipoPrecio, Descuento, EsExtra, IdDetallePadre)
          VALUES (?, ?, ?, ?, NOW(), ?, ?, 1, 0, 1, ?)
        `, [idVenta, extra.IdProducto, item.quantity, extra.Precio1, folio, idApertura, parentId]);
      }
    }

    for (const update of inventoryUpdates) {
      const previous = Number(update.product.StockActual);
      await connection.query('UPDATE tblProductos SET StockActual = ? WHERE IdProducto = ?', [update.nextStock, update.product.IdProducto]);
      await connection.query(
        `INSERT INTO tblMovimientosInventario
         (IdProducto, TipoMovimiento, Cantidad, StockAnterior, StockNuevo, Motivo, IdVenta)
         VALUES (?, 'SALIDA', ?, ?, ?, ?, ?)`,
        [update.product.IdProducto, -update.quantity, previous, update.nextStock, `Venta ${folioStr}`, idVenta]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, idVenta, folio: folioStr });
  } catch (error) {
    await connection.rollback();
    if (error instanceof SaleValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error('Sales POST error:', error);
    return NextResponse.json({ message: 'Error al procesar la venta' }, { status: 500 });
  } finally {
    connection.release();
  }
}
