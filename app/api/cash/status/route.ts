import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tblAperturasCierres WHERE IdSupervisorCierre = 0 OR IdSupervisorCierre IS NULL ORDER BY IdApertura DESC LIMIT 1'
    );
    const session = (rows as any[])[0];

    if (!session) {
      return NextResponse.json({ isOpen: false });
    }

    // Get current totals for the session
    const [sales] = await pool.query(
      'SELECT SUM(Total) as TotalVentas, SUM(Efectivo) as Efectivo, SUM(Tarjeta) as Tarjeta, SUM(Transferencia) as Transferencia FROM tblVentas WHERE IdApertura = ? AND Cancelada = 0',
      [session.IdApertura]
    );
    const totals = (sales as any[])[0];

    return NextResponse.json({ 
      isOpen: true, 
      session: { 
        ...session, 
        TotalVentas: totals.TotalVentas || 0,
        Efectivo: totals.Efectivo || 0,
        Tarjeta: totals.Tarjeta || 0,
        Transferencia: totals.Transferencia || 0
      } 
    });
  } catch (error) {
    console.error('Cash status error:', error);
    return NextResponse.json({ message: 'Error al consultar el estado de la caja' }, { status: 500 });
  }
}
