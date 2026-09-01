import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const capacity = Number(body.Capacidad);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.Fecha) || !/^\d{2}:\d{2}$/.test(body.HoraInicio) || !/^\d{2}:\d{2}$/.test(body.HoraFin) || body.HoraInicio >= body.HoraFin || capacity < 0) {
      return NextResponse.json({ message: 'Revisa fecha, horario y capacidad' }, { status: 400 });
    }
    const [overlap] = await pool.query(
      `SELECT IdExcepcion FROM tblExcepcionesAgenda
       WHERE Fecha = ? AND HoraInicio < ? AND HoraFin > ? LIMIT 1`,
      [body.Fecha, body.HoraFin, body.HoraInicio]
    );
    if ((overlap as any[]).length) {
      return NextResponse.json({ message: 'La excepción se cruza con otra de la misma fecha' }, { status: 400 });
    }
    const [result] = await pool.query(
      'INSERT INTO tblExcepcionesAgenda (Fecha, HoraInicio, HoraFin, Capacidad, Nota) VALUES (?, ?, ?, ?, ?)',
      [body.Fecha, body.HoraInicio, body.HoraFin, capacity, String(body.Nota || '').trim() || null]
    );
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Agenda exceptions POST error:', error);
    return NextResponse.json({ message: 'No se pudo crear la excepción' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ message: 'Excepción inválida' }, { status: 400 });
    await pool.query('DELETE FROM tblExcepcionesAgenda WHERE IdExcepcion = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agenda exceptions DELETE error:', error);
    return NextResponse.json({ message: 'No se pudo eliminar la excepción' }, { status: 500 });
  }
}
