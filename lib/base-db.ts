import mysql from 'mysql2/promise';
import { requireEnv } from '@/lib/env';

// Pool único de DIZOE POS. La aplicación siempre utiliza la base configurada
// en DB_NAME y no consulta registros ni conexiones de otros proyectos.
const basePool = mysql.createPool({
  host: requireEnv('DB_HOST'),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  // DECIMAL como número JS: sin esto llegan como string y las sumas en el
  // frontend concatenan texto (ej. "350.00" + "330.00" → NaN).
  decimalNumbers: true,
});

export default basePool;
