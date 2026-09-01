import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblClientes (
        IdCliente INT AUTO_INCREMENT PRIMARY KEY,
        NombreCliente VARCHAR(255) NOT NULL,
        Telefono VARCHAR(30),
        CorreoElectronico VARCHAR(255),
        FechaRegistro DATETIME DEFAULT NOW(),
        Status TINYINT DEFAULT 1
      )
    `);

    const [rows] = await pool.query('SELECT * FROM tblClientes WHERE Status = 1 ORDER BY NombreCliente ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Clientes GET error:', error);
    return NextResponse.json({ message: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { NombreCliente, Telefono, CorreoElectronico } = await request.json();
    if (!NombreCliente) {
      return NextResponse.json({ message: 'Nombre es obligatorio' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO tblClientes (NombreCliente, Telefono, CorreoElectronico) VALUES (?, ?, ?)',
      [NombreCliente, Telefono, CorreoElectronico]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Clientes POST error:', error);
    return NextResponse.json({ message: 'Error al crear cliente' }, { status: 500 });
  }
}
