import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const validTime = (value: unknown) => typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const day = Number(body.DiaSemana);
    const capacity = Number(body.Capacidad);
    if (!Number.isInteger(day) || day < 0 || day > 6 || !validTime(body.HoraInicio) || !validTime(body.HoraFin) || body.HoraInicio >= body.HoraFin || capacity < 1) {
      return NextResponse.json({ message: 'Revisa día, horario y capacidad' }, { status: 400 });
    }
    const [overlap] = await pool.query(
      `SELECT IdHorario FROM tblHorariosAgenda
       WHERE DiaSemana = ? AND Activo = 1 AND HoraInicio < ? AND HoraFin > ? LIMIT 1`,
      [day, body.HoraFin, body.HoraInicio]
    );
    if ((overlap as any[]).length) {
      return NextResponse.json({ message: 'Ese bloque se cruza con otro horario del mismo día' }, { status: 400 });
    }
    const [result] = await pool.query(
      'INSERT INTO tblHorariosAgenda (DiaSemana, HoraInicio, HoraFin, Capacidad, Activo) VALUES (?, ?, ?, ?, 1)',
      [day, body.HoraInicio, body.HoraFin, capacity]
    );
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Agenda hours POST error:', error);
    return NextResponse.json({ message: 'No se pudo crear el horario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ message: 'Horario inválido' }, { status: 400 });
    await pool.query('DELETE FROM tblHorariosAgenda WHERE IdHorario = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agenda hours DELETE error:', error);
    return NextResponse.json({ message: 'No se pudo eliminar el horario' }, { status: 500 });
  }
}
