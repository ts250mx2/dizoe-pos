import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { action, amount, id, totals } = await request.json();

    if (action === 'open') {
      const [result] = await pool.query(
        'INSERT INTO tblAperturasCierres (FechaApertura, FondoCaja, IdSupervisorCierre) VALUES (NOW(), ?, 0)',
        [amount]
      );
      return NextResponse.json({ success: true, id: (result as any).insertId });
    }

    if (action === 'close') {
      await pool.query(
        'UPDATE tblAperturasCierres SET FechaCierre = NOW(), IdSupervisorCierre = 1, Efectivo = ?, Tarjeta = ?, TotalVentas = ?, Cancelados = ? WHERE IdApertura = ?',
        [totals.efectivo, totals.tarjeta, totals.total, totals.cancelados, id]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
