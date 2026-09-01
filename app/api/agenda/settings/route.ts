import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [config] = await pool.query('SELECT * FROM tblConfiguracionAgenda WHERE Id = 1');
    const [hours] = await pool.query(`
      SELECT IdHorario, DiaSemana, TIME_FORMAT(HoraInicio, '%H:%i') HoraInicio,
             TIME_FORMAT(HoraFin, '%H:%i') HoraFin, Capacidad, Activo
      FROM tblHorariosAgenda ORDER BY DiaSemana, HoraInicio
    `);
    const [exceptions] = await pool.query(`
      SELECT IdExcepcion, DATE_FORMAT(Fecha, '%Y-%m-%d') Fecha,
             TIME_FORMAT(HoraInicio, '%H:%i') HoraInicio,
             TIME_FORMAT(HoraFin, '%H:%i') HoraFin, Capacidad, Nota
      FROM tblExcepcionesAgenda
      WHERE Fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY Fecha, HoraInicio
    `);
    return NextResponse.json({ config: (config as any[])[0], hours, exceptions });
  } catch (error) {
    console.error('Agenda settings GET error:', error);
    return NextResponse.json({ message: 'No se pudo cargar la configuración' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const interval = Number(body.IntervaloMinutos);
    const lead = Number(body.AnticipacionMinimaHoras);
    const future = Number(body.DiasFuturos);
    if (interval < 5 || interval > 240 || lead < 0 || future < 1 || future > 365) {
      return NextResponse.json({ message: 'Los valores de configuración están fuera de rango' }, { status: 400 });
    }
    await pool.query(
      `UPDATE tblConfiguracionAgenda SET IntervaloMinutos = ?, AnticipacionMinimaHoras = ?,
       DiasFuturos = ?, ReservasPublicasActivas = ? WHERE Id = 1`,
      [interval, lead, future, body.ReservasPublicasActivas ? 1 : 0]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agenda settings PUT error:', error);
    return NextResponse.json({ message: 'No se pudo guardar la configuración' }, { status: 500 });
  }
}
