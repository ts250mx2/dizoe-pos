import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

type Queryable = Pick<Pool | PoolConnection, 'query'>;

interface AgendaConfig extends RowDataPacket {
  IntervaloMinutos: number;
  AnticipacionMinimaHoras: number;
  DiasFuturos: number;
  ReservasPublicasActivas: number;
}

interface TimeBlock extends RowDataPacket {
  HoraInicio: string;
  HoraFin: string;
  Capacidad: number;
}

interface Appointment extends RowDataPacket {
  FechaCita: Date | string;
  Duracion: number;
}

export interface AvailabilitySlot {
  time: string;
  capacity: number;
  occupied: number;
  available: number;
  status: 'available' | 'occupied';
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const localDate = (date: string, minutes = 0) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
};

export async function getAgendaConfig(db: Queryable): Promise<AgendaConfig> {
  const [rows] = await db.query<AgendaConfig[]>('SELECT * FROM tblConfiguracionAgenda WHERE Id = 1');
  return rows[0];
}

export async function getAvailability(db: Queryable, date: string, duration: number): Promise<AvailabilitySlot[]> {
  const config = await getAgendaConfig(db);
  if (!config || !config.ReservasPublicasActivas) return [];

  const requestedDate = localDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(today);
  lastDate.setDate(lastDate.getDate() + Number(config.DiasFuturos));
  if (requestedDate < today || requestedDate > lastDate) return [];

  const dayOfWeek = requestedDate.getDay();
  const [blocks] = await db.query<TimeBlock[]>(
    `SELECT TIME_FORMAT(HoraInicio, '%H:%i') HoraInicio,
            TIME_FORMAT(HoraFin, '%H:%i') HoraFin, Capacidad
     FROM tblHorariosAgenda WHERE DiaSemana = ? AND Activo = 1 ORDER BY HoraInicio`,
    [dayOfWeek]
  );
  const [exceptions] = await db.query<TimeBlock[]>(
    `SELECT TIME_FORMAT(HoraInicio, '%H:%i') HoraInicio,
            TIME_FORMAT(HoraFin, '%H:%i') HoraFin, Capacidad
     FROM tblExcepcionesAgenda WHERE Fecha = ? ORDER BY HoraInicio`,
    [date]
  );
  const [appointments] = await db.query<Appointment[]>(
    `SELECT FechaCita, Duracion FROM tblCitas
     WHERE Status != 3 AND FechaCita >= ? AND FechaCita < DATE_ADD(?, INTERVAL 1 DAY)`,
    [`${date} 00:00:00`, `${date} 00:00:00`]
  );

  const interval = Math.max(5, Number(config.IntervaloMinutos));
  const leadTime = new Date(Date.now() + Number(config.AnticipacionMinimaHoras) * 60 * 60 * 1000);
  const slots = new Map<string, AvailabilitySlot>();

  // Las excepciones con capacidad también pueden abrir horas en un día que
  // normalmente está cerrado. El Map evita duplicar slots entre ambos orígenes.
  const candidateBlocks = [
    ...blocks,
    ...exceptions.filter((exception) => Number(exception.Capacidad) > 0),
  ];

  for (const block of candidateBlocks) {
    const blockStart = toMinutes(block.HoraInicio);
    const blockEnd = toMinutes(block.HoraFin);
    for (let start = blockStart; start + duration <= blockEnd; start += interval) {
      const end = start + duration;
      const slotDate = localDate(date, start);
      if (slotDate < leadTime) continue;

      const overlappingExceptions = exceptions.filter((exception) => toMinutes(exception.HoraInicio) < end && toMinutes(exception.HoraFin) > start);
      let capacity: number;
      if (overlappingExceptions.length) {
        const covering = overlappingExceptions.find((exception) => toMinutes(exception.HoraInicio) <= start && toMinutes(exception.HoraFin) >= end);
        if (!covering) continue;
        capacity = Number(covering.Capacidad);
      } else {
        const weeklyBlock = blocks.find((weekly) => toMinutes(weekly.HoraInicio) <= start && toMinutes(weekly.HoraFin) >= end);
        if (!weeklyBlock) continue;
        capacity = Number(weeklyBlock.Capacidad);
      }

      const occupied = appointments.filter((appointment) => {
        const appointmentStart = new Date(appointment.FechaCita).getTime();
        const appointmentEnd = appointmentStart + Number(appointment.Duracion || 60) * 60000;
        return appointmentStart < slotDate.getTime() + duration * 60000 && appointmentEnd > slotDate.getTime();
      }).length;
      const available = Math.max(0, capacity - occupied);
      slots.set(toTime(start), { time: toTime(start), capacity, occupied, available, status: available > 0 ? 'available' : 'occupied' });
    }
  }
  return [...slots.values()].sort((a, b) => a.time.localeCompare(b.time));
}
