import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Campos que el cliente puede actualizar en una cita.
const UPDATABLE_FIELDS = ['IdCliente', 'Titulo', 'Descripcion', 'FechaCita', 'Duracion', 'Status'] as const;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // UPDATE parcial: solo los campos presentes en el body. Actualizar todo
    // siempre borraba la cita: al editar no llega Status y al cambiar Status
    // no llegan los demás campos, y esos undefined se guardaban como NULL.
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: 'Nada que actualizar' }, { status: 400 });
    }

    await pool.query(
      `UPDATE tblCitas SET ${setClauses.join(', ')} WHERE IdCita = ?`,
      [...values, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Citas PUT error:', error);
    return NextResponse.json({ message: 'Error al actualizar cita' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Status 3 = Cancelada
    await pool.query('UPDATE tblCitas SET Status = 3 WHERE IdCita = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Citas DELETE error:', error);
    return NextResponse.json({ message: 'Error al eliminar cita' }, { status: 500 });
  }
}
