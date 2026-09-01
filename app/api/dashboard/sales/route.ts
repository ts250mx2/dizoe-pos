import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo   = searchParams.get('dateTo') || '';
    const groupBy  = searchParams.get('groupBy') || 'categoria';

    const start = `${dateFrom} 00:00:00`;
    const end   = `${dateTo} 23:59:59`;

    // 1. KPI
    const [kpiRows] = await pool.query(`
      SELECT 
        SUM(Total) as totalVentas,
        COUNT(*) as numTransacciones,
        AVG(Total) as ticketPromedio,
        SUM(Efectivo) as efectivo,
        SUM(Tarjeta) as tarjeta,
        SUM(Transferencia) as transferencia,
        SUM(CASE WHEN Cancelada = 1 THEN 1 ELSE 0 END) as canceladas
      FROM tblVentas
      WHERE FechaVenta BETWEEN ? AND ?
    `, [start, end]);
    const kpi = (kpiRows as any[])[0];

    // 2. Trend (Sales by day)
    const [trend] = await pool.query(`
      SELECT 
        DATE(FechaVenta) as fecha,
        SUM(Total) as total,
        COUNT(*) as transacciones
      FROM tblVentas
      WHERE FechaVenta BETWEEN ? AND ? AND Cancelada = 0
      GROUP BY DATE(FechaVenta)
      ORDER BY fecha ASC
    `, [start, end]);

    // 3. Breakdown (By Category or Product)
    let breakdownQuery = '';
    if (groupBy === 'categoria') {
      breakdownQuery = `
        SELECT 
          c.Categoria as nombre,
          SUM(d.Cantidad * d.Precio) as total,
          SUM(d.Cantidad) as cantidad
        FROM tblDetalleVentas d
        JOIN tblProductos p ON d.IdProducto = p.IdProducto
        JOIN tblCategorias c ON p.IdCategoria = c.IdCategoria
        WHERE d.Fecha BETWEEN ? AND ?
        GROUP BY c.IdCategoria
        ORDER BY total DESC
      `;
    } else {
      breakdownQuery = `
        SELECT 
          p.Producto as nombre,
          SUM(d.Cantidad * d.Precio) as total,
          SUM(d.Cantidad) as cantidad
        FROM tblDetalleVentas d
        JOIN tblProductos p ON d.IdProducto = p.IdProducto
        WHERE d.Fecha BETWEEN ? AND ?
        GROUP BY p.IdProducto
        ORDER BY total DESC
        LIMIT 15
      `;
    }
    const [breakdown] = await pool.query(breakdownQuery, [start, end]);

    // 4. Heatmap (Sales by day of week and hour)
    const [heatmap] = await pool.query(`
      SELECT 
        DAYOFWEEK(FechaVenta) - 1 as diaSemana,
        HOUR(FechaVenta) as hora,
        SUM(Total) as total,
        COUNT(*) as transacciones
      FROM tblVentas
      WHERE FechaVenta BETWEEN ? AND ? AND Cancelada = 0
      GROUP BY diaSemana, hora
      ORDER BY diaSemana, hora
    `, [start, end]);

    return NextResponse.json({
      kpi,
      trend,
      breakdown,
      heatmap
    });
  } catch (error) {
    console.error('Dashboard Sales API error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
