import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idApertura = searchParams.get('idApertura');

    if (idApertura) {
      const [rows] = await pool.query('SELECT * FROM tblMovimientos WHERE IdApertura = ? ORDER BY IdMovimiento DESC', [idApertura]);
      return NextResponse.json(rows);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Movements GET error:', error);
    return NextResponse.json({ message: 'Error al consultar movimientos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { idApertura, amount, concept, type } = await request.json();
    const finalAmount = type === 'salida' ? -amount : amount;

    const [result] = await pool.query(
      'INSERT INTO tblMovimientos (IdApertura, Concepto, Efectivo, FechaRetiro) VALUES (?, ?, ?, NOW())',
      [idApertura, concept, finalAmount]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Movements POST error:', error);
    return NextResponse.json({ message: 'Error al registrar el movimiento' }, { status: 500 });
  }
}
