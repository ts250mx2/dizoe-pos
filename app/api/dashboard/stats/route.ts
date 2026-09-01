import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Basic stats for dashboard
    const [sales] = await pool.query('SELECT SUM(Total) as total, COUNT(*) as count FROM tblVentas WHERE Cancelada = 0');
    const [clients] = await pool.query('SELECT COUNT(*) as count FROM tblClientes WHERE Status = 1');
    const [citas] = await pool.query('SELECT COUNT(*) as count FROM tblCitas WHERE Status = 1 AND FechaCita >= CURDATE()');
    
    // Last 5 sales
    const [recentSales] = await pool.query(`
      SELECT v.*, c.NombreCliente 
      FROM tblVentas v 
      LEFT JOIN tblClientes c ON v.IdCliente = c.IdCliente 
      ORDER BY v.FechaVenta DESC LIMIT 5
    `);

    return NextResponse.json({
      sales: (sales as any[])[0],
      clients: (clients as any[])[0].count,
      citas: (citas as any[])[0].count,
      recentSales
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
