import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Historial completo de movimientos de caja de DIZOE:
 * aperturas (fondo inicial), ventas no canceladas y entradas/salidas
 * manuales, unificados y ordenados por fecha descendente.
 */
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT CONCAT('A-', a.IdApertura) AS Id,
             a.IdApertura,
             'apertura' AS Tipo,
             'Apertura de caja (fondo inicial)' AS Concepto,
             a.FondoCaja AS Monto,
             a.FechaApertura AS Fecha
      FROM tblAperturasCierres a
      UNION ALL
      SELECT CONCAT('V-', v.IdVenta),
             v.IdApertura,
             'venta',
             CONCAT('Venta ', IFNULL(v.Folio, CONCAT('#', v.IdVenta))),
             v.Total,
             v.FechaVenta
      FROM tblVentas v
      WHERE v.Cancelada = 0
      UNION ALL
      SELECT CONCAT('M-', m.IdMovimiento),
             m.IdApertura,
             IF(m.Efectivo >= 0, 'entrada', 'salida'),
             m.Concepto,
             m.Efectivo,
             m.FechaRetiro
      FROM tblMovimientos m
      ORDER BY Fecha DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Movements history error:', error);
    return NextResponse.json({ message: 'Error al consultar el historial de movimientos' }, { status: 500 });
  }
}
