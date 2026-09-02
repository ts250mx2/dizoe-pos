import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const clientId = Number(id);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return NextResponse.json({ message: 'Cliente no válido' }, { status: 400 });
    }

    const [[clients], [sales], [appointments]] = await Promise.all([
      pool.query('SELECT IdCliente, NombreCliente, Telefono, CorreoElectronico, FechaRegistro FROM tblClientes WHERE IdCliente = ? LIMIT 1', [clientId]),
      pool.query(`
        SELECT v.IdVenta, v.Folio, v.Total, v.FechaVenta, v.Cancelada,
               GROUP_CONCAT(CONCAT(CAST(d.Cantidad AS DECIMAL(10,0)), ' × ', p.Producto) ORDER BY d.IdDetalleVenta SEPARATOR ' · ') AS Detalle
        FROM tblVentas v
        LEFT JOIN tblDetalleVentas d ON d.IdVenta = v.IdVenta
        LEFT JOIN tblProductos p ON p.IdProducto = d.IdProducto
        WHERE v.IdCliente = ?
        GROUP BY v.IdVenta, v.Folio, v.Total, v.FechaVenta, v.Cancelada
        ORDER BY v.FechaVenta DESC LIMIT 100
      `, [clientId]),
      pool.query(`
        SELECT IdCita, Titulo, Descripcion, FechaCita, Duracion, Status, Origen
        FROM tblCitas WHERE IdCliente = ? ORDER BY FechaCita DESC LIMIT 100
      `, [clientId]),
    ]);

    const client = (clients as any[])[0];
    if (!client) return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });
    const saleRows = sales as any[];
    const appointmentRows = appointments as any[];
    const completedSales = saleRows.filter((sale) => Number(sale.Cancelada) === 0);
    return NextResponse.json({
      client,
      summary: {
        purchases: completedSales.length,
        appointments: appointmentRows.length,
        totalSpent: completedSales.reduce((total, sale) => total + Number(sale.Total || 0), 0),
      },
      sales: saleRows,
      appointments: appointmentRows,
    });
  } catch (error) {
    console.error('Cliente history GET error:', error);
    return NextResponse.json({ message: 'No se pudo cargar el historial del cliente' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { NombreCliente, Telefono, CorreoElectronico } = await request.json();

    await pool.query(
      'UPDATE tblClientes SET NombreCliente = ?, Telefono = ?, CorreoElectronico = ? WHERE IdCliente = ?',
      [NombreCliente, Telefono, CorreoElectronico, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clientes PUT error:', error);
    return NextResponse.json({ message: 'Error al actualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query('UPDATE tblClientes SET Status = 0 WHERE IdCliente = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clientes DELETE error:', error);
    return NextResponse.json({ message: 'Error al eliminar cliente' }, { status: 500 });
  }
}
