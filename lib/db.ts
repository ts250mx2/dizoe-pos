import { FieldPacket, Pool, PoolConnection, QueryOptions } from 'mysql2/promise';
import pool from '@/lib/base-db';

type QueryValues = Parameters<Pool['query']>[1];
type ExecuteValues = Parameters<Pool['execute']>[1];

/**
 * Acceso único a la base de datos de DIZOE POS.
 * No usa cookies ni selección de proyecto: todo apunta a DB_NAME.
 */
const db = {
  async query(sql: string | QueryOptions, values?: QueryValues): Promise<[unknown, FieldPacket[]]> {
    return pool.query(sql as string, values);
  },

  async execute(sql: string | QueryOptions, values?: ExecuteValues): Promise<[unknown, FieldPacket[]]> {
    return pool.execute(sql as string, values);
  },

  async getConnection(): Promise<PoolConnection> {
    return pool.getConnection();
  },
};

export default db;
