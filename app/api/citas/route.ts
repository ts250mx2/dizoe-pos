import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblCitas (
        IdCita INT AUTO_INCREMENT PRIMARY KEY,
        IdCliente INT NOT NULL,
        Titulo VARCHAR(255),
        Descripcion TEXT,
        FechaCita DATETIME NOT NULL,
        Duracion INT DEFAULT 60,
        Status TINYINT DEFAULT 1,
        IdUsuario INT,
        FechaRegistro DATETIME DEFAULT NOW()
      )
    `);

    // Reparación de datos: un bug anterior del PUT dejaba Status en NULL al
    // editar, y esas citas desaparecían del calendario. Se restauran como
    // pendientes (1). Idempotente: sin filas afectadas no hace nada.
    await pool.query('UPDATE tblCitas SET Status = 1 WHERE Status IS NULL');

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = `
      SELECT c.*, cl.NombreCliente, cl.Telefono 
      FROM tblCitas c 
      JOIN tblClientes cl ON c.IdCliente = cl.IdCliente 
      WHERE c.Status != 3
    `;
    const params: any[] = [];

    if (start && end) {
      query += ` AND FechaCita BETWEEN ? AND ?`;
      params.push(start, end);
    }

    query += ` ORDER BY FechaCita ASC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Citas GET error:', error);
    return NextResponse.json({ message: 'Error al obtener citas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { IdCliente, Titulo, Descripcion, FechaCita, Duracion, IdUsuario } = await request.json();

    const [result] = await pool.query(
      `INSERT INTO tblCitas (IdCliente, Titulo, Descripcion, FechaCita, Duracion, IdUsuario) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [IdCliente, Titulo, Descripcion, FechaCita, Duracion || 60, IdUsuario]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Citas POST error:', error);
    return NextResponse.json({ message: 'Error al crear cita' }, { status: 500 });
  }
}
