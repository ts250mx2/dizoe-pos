import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';
import { getAgendaConfig, getAvailability } from '@/lib/booking';
import { normalizePhone, PHONE_NORMALIZED_SQL } from '@/lib/phone';

interface ServiceRow extends RowDataPacket {
  IdProducto: number;
  Producto: string;
  DuracionMinutos: number;
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  let lockName = '';
  try {
    const body = await request.json();
    const date = String(body.fecha || '');
    const time = String(body.hora || '');
    const productId = Number(body.idProducto);
    const name = String(body.nombre || '').trim();
    const rawPhone = String(body.telefono || '').trim();
    const phoneNormalized = normalizePhone(rawPhone);
    const phoneForStorage = rawPhone.startsWith('+') ? `+${phoneNormalized}` : phoneNormalized;
    const legacyPhone = phoneNormalized.startsWith('52') && phoneNormalized.length === 12 ? phoneNormalized.slice(2) : phoneNormalized;
    const email = String(body.correo || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(productId) || !name || phoneNormalized.length < 7) {
      return NextResponse.json({ message: 'Completa nombre, teléfono, servicio, fecha y hora' }, { status: 400 });
    }

    const config = await getAgendaConfig(connection);
    if (!config?.ReservasPublicasActivas) {
      return NextResponse.json({ message: 'Las reservaciones en línea están pausadas' }, { status: 400 });
    }

    const [services] = await connection.query<ServiceRow[]>(`
      SELECT p.IdProducto, p.Producto, p.DuracionMinutos
      FROM tblProductos p INNER JOIN tblCategorias c ON c.IdCategoria = p.IdCategoria
      WHERE p.IdProducto = ? AND p.Status = 1 AND c.TipoCategoria = 'SERVICIO'
    `, [productId]);
    const service = services[0];
    if (!service) return NextResponse.json({ message: 'El servicio ya no está disponible' }, { status: 400 });

    lockName = `dizoe-booking:${date}:${time}`;
    const [lockRows] = await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?, 5) acquired', [lockName]);
    if (Number(lockRows[0]?.acquired) !== 1) {
      return NextResponse.json({ message: 'Ese horario está siendo reservado. Intenta nuevamente.' }, { status: 409 });
    }

    const availability = await getAvailability(connection, date, Number(service.DuracionMinutos || 60));
    const slot = availability.find((item) => item.time === time);
    if (!slot || slot.available <= 0) {
      return NextResponse.json({ message: 'Ese horario ya está ocupado. Elige otro disponible.' }, { status: 409 });
    }

    await connection.beginTransaction();
    const [clients] = await connection.query<RowDataPacket[]>(
      `SELECT IdCliente FROM tblClientes
       WHERE (${PHONE_NORMALIZED_SQL} = ? OR ${PHONE_NORMALIZED_SQL} = ?)
         AND Status = 1
       ORDER BY IdCliente DESC LIMIT 1`,
      [phoneNormalized, legacyPhone]
    );
    let clientId = clients[0]?.IdCliente;
    if (clientId) {
      await connection.query(
        'UPDATE tblClientes SET NombreCliente = ?, CorreoElectronico = COALESCE(NULLIF(?, \'\'), CorreoElectronico) WHERE IdCliente = ?',
        [name, email, clientId]
      );
    } else {
      const [clientResult] = await connection.query(
        'INSERT INTO tblClientes (NombreCliente, Telefono, CorreoElectronico) VALUES (?, ?, ?)',
        [name, phoneForStorage, email || null]
      );
      clientId = (clientResult as any).insertId;
    }

    const [result] = await connection.query(
      `INSERT INTO tblCitas
       (IdCliente, Titulo, Descripcion, FechaCita, Duracion, IdProducto, Origen, Status)
       VALUES (?, ?, 'Reserva en línea', ?, ?, ?, 'PUBLICO', 1)`,
      [clientId, service.Producto, `${date} ${time}:00`, Number(service.DuracionMinutos || 60), productId]
    );
    await connection.commit();

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      booking: { service: service.Producto, date, time, duration: Number(service.DuracionMinutos || 60) },
    });
  } catch (error) {
    try { await connection.rollback(); } catch { /* transaction may not have started */ }
    console.error('Public booking reserve error:', error);
    return NextResponse.json({ message: 'No se pudo confirmar la cita' }, { status: 500 });
  } finally {
    if (lockName) {
      try { await connection.query('SELECT RELEASE_LOCK(?)', [lockName]); } catch { /* connection cleanup */ }
    }
    connection.release();
  }
}
